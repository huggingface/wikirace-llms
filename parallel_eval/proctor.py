from game import AgentPlayer, SQLiteDB, Game
import os
import json
import asyncio
import argparse


class Proctor:
    def __init__(
        self,
        article_list: list[tuple[str, str]],
        num_trials: int,
        num_workers: int,
        max_steps: int,
        agent_settings: dict,
        db_path: str,
        verbose: bool = True,
        output_dir: str = "./proctor_tmp",
        proctor_id: str = "proctor_1",
        starting_seed: int = 42,
    ):
        self.article_list = article_list
        self.num_trials = num_trials
        self.num_workers = num_workers
        self.max_steps = max_steps
        self.agent_settings = agent_settings
        self.db_path = db_path
        self.verbose = verbose
        self.output_dir = output_dir
        self.proctor_id = proctor_id
        self.db = SQLiteDB(self.db_path)
        self.starting_seed = starting_seed

        os.makedirs(self.output_dir, exist_ok=True)

        self.runs = []

        self.setup_runs()

    def setup_runs(self):
        for start in self.article_list:
            for destination in self.article_list:
                if start == destination:
                    continue
                for n in range(self.num_trials):
                    run_id = f"{self.proctor_id}_{start}_{destination}_{n}"
                    self.runs.append(
                        Run(
                            start,
                            destination,
                            self.max_steps,
                            self.agent_settings,
                            self.db,
                            self.output_dir,
                            self.verbose,
                            run_id,
                            self.starting_seed + n,
                        )
                    )
                    print(f"Setup run {run_id}")

    async def run(self):
        semaphore = asyncio.Semaphore(self.num_workers)
        tasks = []

        async def run_with_semaphore(run_instance):
            async with semaphore:
                if self.verbose:
                    print(f"Starting run {run_instance.id}")
                await run_instance.run()
                if self.verbose:
                    print(f"Finished run {run_instance.id}")

        for run_instance in self.runs:
            tasks.append(asyncio.create_task(run_with_semaphore(run_instance)))

        await asyncio.gather(*tasks)

        self.analyze_runs()

    def analyze_runs(self):
        """We need to analze all the runs into a .json"""
        final_results = {
            "article_list": self.article_list,
            "num_trials": self.num_trials,
            "num_workers": self.num_workers,
            "max_steps": self.max_steps,
            "agent_settings": self.agent_settings,
            "runs": [],
        }

        win_count = 0
        lose_count = 0
        hops_distribution = []

        for run in self.runs:
            with open(run.output_file, "r") as f:
                result = json.load(f)
                final_results["runs"].append(result)
                if result["result"] == "win":
                    win_count += 1
                    hops_distribution.append(len(result["steps"]) - 1)
                else:
                    lose_count += 1

        final_results["hops_distribution"] = hops_distribution
        final_results["average_hops"] = sum(hops_distribution) / len(hops_distribution)
        final_results["win_rate"] = win_count / len(self.runs)
        final_results["lose_rate"] = lose_count / len(self.runs)

        with open(f"{self.output_dir}/{self.proctor_id}-final-results.json", "w") as f:
            json.dump(final_results, f, indent=4)


class Run:
    def __init__(
        self,
        start_article: str,
        destination_article: str,
        max_steps: int,
        agent_settings: dict,
        db: SQLiteDB,
        output_dir: str,
        verbose: bool,
        id: str,
        seed: int,
    ):
        self.start_article = start_article
        self.destination_article = destination_article
        self.max_steps = max_steps
        self.agent_settings = agent_settings
        self.db = db
        self.output_dir = output_dir
        self.verbose = verbose
        self.id = id
        self.seed = seed

        self.output_file = f"{self.output_dir}/run_{self.id}.json"

    async def run(self):
        if os.path.exists(self.output_file):
            return

        player = AgentPlayer(
            model=self.agent_settings["model"],
            api_base=self.agent_settings["api_base"],
            max_links=self.agent_settings["max_links"],
            max_tries=self.agent_settings["max_tries"],
            verbose=False,
            seed=self.seed,
        )

        game = Game(
            self.start_article,
            self.destination_article,
            self.db,
            self.max_steps,
            player,
            verbose=False,
        )

        steps = await game.run()

        output = {
            "model": self.agent_settings["model"],
            "api_base": self.agent_settings["api_base"],
            "max_links": self.agent_settings["max_links"],
            "max_tries": self.agent_settings["max_tries"],
            "start_article": self.start_article,
            "destination_article": self.destination_article,
            "steps": steps,
            "seed": self.seed,
            "result": steps[-1]["type"],
        }

        with open(self.output_file, "w") as f:
            json.dump(output, f, indent=4)

        print(f"Run {self.id} completed in {len(steps)} steps")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run parallel Wikispeedia evaluations")
    parser.add_argument("--model", type=str, default="gpt-4o", help="Model to use for agent")
    parser.add_argument("--api-base", type=str, default=None, help="API base URL for hosted models")
    parser.add_argument("--workers", type=int, default=20, help="Number of parallel workers")
    parser.add_argument("--trials", type=int, default=1, help="Number of trials per start-destination pair")
    parser.add_argument("--max-steps", type=int, default=20, help="Maximum steps per game")
    parser.add_argument("--max-links", type=int, default=200, help="Maximum links per page for agent")
    parser.add_argument("--max-tries", type=int, default=3, help="Maximum retries for agent")
    parser.add_argument("--db-path", type=str, default="wikihop.db", help="Path to the wikihop database")
    parser.add_argument("--output-dir", type=str, default="./proctor_tmp", help="Directory for output files")
    parser.add_argument("--proctor-id", type=str, default="proctor_1", help="Unique identifier for this proctor run")
    parser.add_argument("--seed", type=int, default=42, help="Starting random seed")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument("--article-list", type=str, default="supernodes.json", 
                        help="Path to JSON file with list of articles to test")

    args = parser.parse_args()

    # check if db exists
    if not os.path.exists(args.db_path):
        raise FileNotFoundError(f"Database file not found at {args.db_path}")
    
    # check if article list exists
    if not os.path.exists(args.article_list):
        raise FileNotFoundError(f"Article list file not found at {args.article_list}")

    # Read article list from file
    with open(args.article_list, "r") as f:
        article_list = json.load(f)

    agent_settings = {
        "model": args.model,
        "api_base": args.api_base,
        "max_links": args.max_links,
        "max_tries": args.max_tries,
    }

    proctor = Proctor(
        article_list=article_list,
        num_trials=args.trials,
        num_workers=args.workers,
        max_steps=args.max_steps,
        agent_settings=agent_settings,
        db_path=args.db_path,
        verbose=args.verbose,
        output_dir=args.output_dir,
        proctor_id=args.proctor_id,
        starting_seed=args.seed,
    )

    asyncio.run(proctor.run())
