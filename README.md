# austincv.com

Personal CV site, vibe coded as an experiment with Claude Code.

No framework, no build step, no code editor opened by me. Every file was written by Claude via the CLI and mobile app.

That said — "vibe coded" doesn't mean hands-off. Claude needed steering. The card flip animation required careful explanation of the rotate-to-edge technique and why `backface-visibility` breaks when children have `overflow: hidden`. The card dimensions needed to be specified as credit-card sized (ID-1, 85.60×53.98mm). The idle tilt angles, the mouse tracking behaviour, the shadow blinking bug — all flagged and fixed through conversation, not code.

The workflow was: describe the problem clearly, Claude fixes it. Repeat.

This README was also prompted — from the tube, on the way to play board games. Some things don't change.
