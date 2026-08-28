# Parents’ Night Out Sports Night retry status

The one-time Parents’ Night Out Sports Night campaign attempted delivery to 459 approved contacts on August 28, 2026. The messaging provider accepted 240 messages and returned rate-limit failures for 219 requests. The failed-recipient retry is **suspended**.

The retry script fails closed unless a future operator both obtains new approval from the owner and deliberately supplies the `--resume-approved` flag. When resumed, it rechecks opt-outs and skips any recipient whose campaign message was accepted after the original run. It does not retry automatically.

No retry attempt was made after the suspension.
