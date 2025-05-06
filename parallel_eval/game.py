from typing import List, Tuple, Dict, Optional
import sqlite3
import json
import litellm
import re
import asyncio
import argparse
from functools import lru_cache
class SQLiteDB:
    def __init__(self, db_path: str):
        """Initialize the database with path to SQLite database"""
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        self._article_count = self._get_article_count()
        print(f"Connected to SQLite database with {self._article_count} articles")

    def _get_article_count(self):
        self.cursor.execute("SELECT COUNT(*) FROM core_articles")
        return self.cursor.fetchone()[0]

    @lru_cache(maxsize=8192)
    def get_article_with_links(self, article_title: str) -> Tuple[str, List[str]]:
        self.cursor.execute(
            "SELECT title, links_json FROM core_articles WHERE title = ?",
            (article_title,),
        )
        article = self.cursor.fetchone()
        if not article:
            return None, []

        links = json.loads(article["links_json"])
        return article["title"], links


class Player:
    def __init__(self, name: str):
        self.name = name

    async def get_move(self, game_state: List[Dict]) -> Tuple[str, Dict]:
        print("Link choices:")
        for i, link in enumerate(game_state[-1]["links"]):
            print(f"{i}: {link}")

        idx = int(input(f"Enter the index of the link you want to select: "))
        return game_state[-1]["links"][idx], {
            "message": f"{self.name} selected link #{i}"
        }  # select the first link


class AgentPlayer(Player):
    def __init__(
        self,
        model: str,
        api_base: str,
        verbose: bool = True,
        max_links=None,
        max_tries=10,
        target_article = None,
        seed = None
    ):
        super().__init__(model)
        self.model = model
        self.api_base = api_base
        self.verbose = verbose
        self.max_links = max_links
        self.max_tries = max_tries
        self.target_article = target_article
        self.seed = seed

    async def get_move(self, game_state: List[Dict]) -> Tuple[str, Dict]:
        prompt = self.construct_prompt(game_state)

        conversation = [
            {"role": "user", "content": prompt}
        ]

        for try_number in range(self.max_tries):
            response = await litellm.acompletion(
                model=self.model,
                api_base=self.api_base,
                messages=conversation,
                seed=self.seed
            )
            response = response.choices[0].message.content

            conversation.append({"role": "assistant", "content": response})

            answer, message = self._attempt_to_extract_answer(response, maximum_answer=len(game_state[-1]["links"]))

            # there was a problem with the answer so give the model another chance
            if answer == -1:
                conversation.append({"role": "user", "content": message})
                continue

            assert answer >= 1 and answer <= len(game_state[-1]["links"]), f"Answer {answer} is out of range"

            # we found an answer so we can return it
            return game_state[-1]["links"][answer-1], {"tries": try_number, "conversation": conversation}

        # we tried the max number of times and still didn't find an answer
        return -1, {"tries": self.max_tries, "conversation": conversation}

    def construct_prompt(self, game_state: List[Dict]) -> str:
        current = game_state[-1]["article"]
        target = self.target_article
        available_links = game_state[-1]["links"]
        formatted_links = "\n".join([f"{i+1}. {link}" for i, link in enumerate(available_links)])
        path_so_far = [step["article"] for step in game_state]

        try:
            formatted_path = ' -> '.join(path_so_far)
        except Exception as e:
            print(f"Error formatting path: {e}")
            print(game_state)
            print("Path so far: ", path_so_far)
            raise e
        
        return f"""You are playing WikiRun, trying to navigate from one Wikipedia article to another using only links.

IMPORTANT: You MUST put your final answer in <answer>NUMBER</answer> tags, where NUMBER is the link number.
For example, if you want to choose link 3, output <answer>3</answer>.

Current article: {current}
Target article: {target}
Available links (numbered):
{formatted_links}

Your path so far: {formatted_path}

Think about which link is most likely to lead you toward the target article.
First, analyze each link briefly and how it connects to your goal, then select the most promising one.

Remember to format your final answer by explicitly writing out the xml number tags like this: <answer>NUMBER</answer>
        """

    def _attempt_to_extract_answer(self, response: str, maximum_answer: Optional[int] = None) -> Tuple[int, str]:
        'returns -1 and a message if no answer is found'

        # Extract choice using format <answer>N</answer>
        choice_match = re.search(r"<answer>(\d+)</answer>", response)

        if choice_match is None:
            return -1, f"No answer found in response. Please respond with a number between 1 and {maximum_answer} in <answer>NUMBER</answer> tags."

        # check if there are multiple answers
        multiple_answers = re.findall(r"<answer>(\d+)</answer>", response)
        if len(multiple_answers) > 1:
            return -1, "Multiple answers found in response. Please respond with just one."

        answer = choice_match.group(1)

        # try to convert to int
        try:
            answer = int(answer)
        except ValueError:
            return -1, f"You answered with {answer} but it could not be converted to an integer. Please respond with a number between 1 and {maximum_answer}."

        # check if the answer is too high or too low
        if answer > maximum_answer or answer < 1:
            return -1, f"You answered with {answer} but you have to select a number between 1 and {maximum_answer}."

        return answer, "" # we found an answer so we don't need to return a message

class Game:
    def __init__(
        self,
        start_article: str,
        target_article: str,
        db: SQLiteDB,
        max_allowed_steps: int,
        player: Player,
        verbose: bool = True,
    ):
        self.start_article = start_article
        self.target_article = target_article
        self.db = db
        self.max_allowed_steps = max_allowed_steps
        self.steps = []
        self.steps_taken = 0
        self.player = player
        self.verbose = verbose
        # Ensure the player knows the target article
        if isinstance(self.player, AgentPlayer):
            self.player.target_article = self.target_article

    async def run(self):

        if self.verbose:
            print(f"Starting game from {self.start_article} to {self.target_article}")

        # get the start article
        _, links = self.db.get_article_with_links(self.start_article)

        self.steps.append(
            {
                "type": "start",
                "article": self.start_article,
                "links": links,
                "metadata": {"message": "Game started"},
            }
        )

        # while the current article is not the target article and the number of steps taken is less than the max allowed steps
        while self.steps_taken < self.max_allowed_steps:
            self.steps_taken += 1

            # Await the async player move
            player_move, metadata = await self.player.get_move(self.steps)

            # player couldn't select a valid link
            if player_move == -1:
                self.steps.append(
                    {"type": "lose", "article": player_move, "metadata": metadata}
                )
                break

            if self.verbose:
                print(f" ->  Step {self.steps_taken}: {player_move}")
                # input("Press Enter to continue...")

            # if we found it its over
            if player_move == self.target_article:
                self.steps.append(
                    {"type": "win", "article": player_move, "metadata": metadata}
                )
                break

            # if not lets get the next article
            _, links = self.db.get_article_with_links(player_move)

            if len(links) == 0:
                self.steps.append(
                    {"type": "lose", "article": player_move, "metadata": metadata}
                )
                break

            self.steps.append(
                {
                    "type": "move",
                    "article": player_move,
                    "links": links,
                    "metadata": metadata,
                }
            )

        return self.steps


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Play the WikiRun game")
    
    # Add mutual exclusion group for player type
    player_group = parser.add_mutually_exclusive_group(required=True)
    player_group.add_argument("--human", action="store_true", help="Play as a human")
    player_group.add_argument("--agent", action="store_true", help="Use an AI agent to play")
    
    # Game parameters
    parser.add_argument("--start", type=str, default="British Library", help="Starting article title")
    parser.add_argument("--end", type=str, default="Saint Lucia", help="Target article title")
    parser.add_argument("--db", type=str, required=True, help="Path to SQLite database")
    parser.add_argument("--max-steps", type=int, default=10, help="Maximum number of steps allowed (default: 10)")
    
    # Agent parameters (only used with --agent)
    parser.add_argument("--model", type=str, default="gpt-4o", help="Model to use for the agent (default: gpt-4o)")
    parser.add_argument("--api-base", type=str, default="https://api.openai.com/v1", 
                        help="API base URL (default: https://api.openai.com/v1)")
    parser.add_argument("--max-links", type=int, default=200, help="Maximum number of links to consider (default: 200)")
    parser.add_argument("--max-tries", type=int, default=3, help="Maximum number of tries for the agent (default: 3)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    
    args = parser.parse_args()

    # Initialize the database
    db = SQLiteDB(args.db)
    
    # Initialize the player based on the argument
    if args.human:
        player = Player("Human")
    else:  # args.agent is True
        player = AgentPlayer(
            model=args.model,
            api_base=args.api_base,
            verbose=True,
            max_links=args.max_links,
            max_tries=args.max_tries,
            target_article=args.end,
            seed=args.seed
        )

    # Create and run the game
    game = Game(
        start_article=args.start,
        target_article=args.end,
        db=db,
        max_allowed_steps=args.max_steps,
        player=player,
        verbose=True
    )

    steps = asyncio.run(game.run())

    print(f"Game over in {len(steps)} steps")
    for i, step in enumerate(steps):
        print(f"Step {i}: {step['type']}")
        print(f"  Article: {step['article']}")
        print(f"  Links: {step.get('links', [])}")
        print(f"  Metadata: {step.get('metadata', {})}")
        print("\n\n")
