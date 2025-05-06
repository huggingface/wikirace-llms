## Setup env

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

# pull wikihop db
wget https://huggingface.co/datasets/HuggingFaceTB/simplewiki-pruned-text-350k/blob/main/wikihop.db -o wikihop.db
```

## Which models does it support?
Under the hood it uses [LiteLLM](https://github.com/BerriAI/litellm) so you can use any major model (dont forget to export appropriate api key), or host any model on huggingface via [vLLM](https://github.com/vllm-project/vllm). 


## Play the game
```
# play the game with cli
python game.py --human --start 'Saint Lucia' --end 'Italy' --db wikihop.db

# have the agent play the game (gpt-4o)
export OPENAI_API_KEY=sk_xxxxx
python game.py --agent --start 'Saint Lucia' --end 'Italy' --db wikihop.db --model gpt-4o --max-steps 20

# run an evaluation suite with qwen3 hosted on vLLM, 200 workers
python proctor.py --model "hosted_vllm/Qwen/Qwen3-30B-A3B" --api-base "http://localhost:8000/v1" --workers 200

# this will produce a `proctor_tmp/proctor_1-final-results.json` that can be visualized in the space, as well as the individual reasoning traces for each run. This is resumable if it is stopped and is idempotent.
```

## JQ command to strip out reasoning traces
This output file will be very large because it contains all the reasoning traces. You can shrink it down and still be able to visualize it with

```bash
jq '{                                  
  article_list: .article_list,
  num_trials: .num_trials,
  num_workers: .num_workers,
  max_steps: .max_steps,
  agent_settings: .agent_settings,
  runs: [.runs[] | {
    model: .model,
    api_base: .api_base,
    max_links: .max_links,
    max_tries: .max_tries, result: .result,
    start_article: .start_article,
    destination_article: .destination_article,
    steps: [.steps[] | {
      type: .type,
      article: .article,
      metadata: (if .metadata.conversation then
        .metadata | del(.conversation)
      else
        .metadata
      end)
    }]
  }]
}' proctor_tmp/proctor_1-final-results.json > cleaned_data.json
```