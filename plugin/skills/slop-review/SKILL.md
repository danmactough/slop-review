---
name: slop-review
description: Open the native diff review window so the user can leave comments on current changes or a selected recent commit, then address each comment.
argument-hint: "[base|last-commit|uncommitted|all] [--base <ref>]"
disable-model-invocation: true
---

# slop-review

Open the native diff review window, wait for the user to submit feedback, then address each comment they wrote.

## Step 1 — invoke the dispatcher via the shell tool

The plugin ships a self-contained dispatcher script. Invoke it via your shell tool with this exact command:

```bash
if [ -n "${CLAUDE_PLUGIN_ROOT}" ] && [ -x "${CLAUDE_PLUGIN_ROOT}/bin/plugin-run.sh" ]; then
  bash "${CLAUDE_PLUGIN_ROOT}/bin/plugin-run.sh" $ARGUMENTS
elif [ -n "${CODEX_PLUGIN_ROOT:-}" ] && [ -x "${CODEX_PLUGIN_ROOT}/bin/plugin-run.sh" ]; then
  bash "${CODEX_PLUGIN_ROOT}/bin/plugin-run.sh" $ARGUMENTS
elif command -v slop-review >/dev/null 2>&1; then
  slop-review $ARGUMENTS
else
  echo "slop-review is not available. Install the plugin via your agent's plugin/marketplace command, or run: npm install -g slop-review" >&2
  exit 1
fi
```

Some hosts fill in the arguments before you see this block, and others don't. If the block still contains an unfilled arguments placeholder, replace it with the text the user typed after the skill name, or remove it if they typed nothing. Never run the block with the placeholder unfilled, because the shell would expand it to nothing and silently open the default scope. Valid first arguments:

- *(none)* — default `base` scope: all changes since the merge-base with the auto-detected base branch (`origin/HEAD` → `origin/main` → `main` → `origin/master` → `master`).
- `last-commit` — `HEAD^ → HEAD`.
- `uncommitted` — working-tree changes vs `HEAD`.
- `all` — debug / browse-only.
- `--base <ref>` — override the auto-detected base branch (only meaningful with `base`).

A native window will open. The user can open **Commits** and select one of the 50 most recent commits without changing the dispatcher arguments. **The shell call will block until the user clicks Submit feedback or closes the window — this can take minutes. Do not run other tool calls in parallel; just wait.**

## Step 2 — interpret the dispatcher's stdout

The dispatcher writes a single line of stdout. Status / progress messages are on stderr; ignore those for parsing.

| stdout | What to do |
|---|---|
| `FEEDBACK_FILE: <absolute path>` | Read that file with your file-reading tool. The contents are numbered review comments, optionally with an "Overall" comment block. Address each numbered item carefully (edit code, run tests, etc.). When done, give the user a brief summary item-by-item. |
| `REVIEW_CANCELLED` | Reply with a single short line confirming the review was cancelled. Do nothing else. |
| Anything else (e.g. an error) | Surface the error verbatim and stop. |

## Notes

- The CLI writes its feedback file under `$TMPDIR/slop-review-<timestamp>.md`. It's a regular file you can `cat`, `wc`, etc.
- If the dispatcher reports that `glimpseui`'s native helper failed to build, follow the exact remediation it prints (usually: install Xcode Command Line Tools on macOS, then re-run).
- This skill never modifies files on its own — it only opens the review UI. All code changes happen in Step 2 after you've read the user's feedback.
