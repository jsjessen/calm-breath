# Calm Breath
**Created by James Jessen**

"DON'T PANIC" ― Douglas Adams, The Hitchhiker's Guide to the Galaxy

I recently had significant difficulty breathing and ended up going to the hospital. I'll never be certain whether it was COVID-19, despite testing negative, or a temporary psychosomatic disorder brought on by the events of 2020. Either way, breathing became important to me and inspired this project.

There are many other breath guides out there but they tend to lack a couple key features:
 - Behavior adapted to how you're currently breathing.
 - Predictable movement so the user can time their breathing accordingly.
   - An expanding circle gives no indication of when it will stop expanding.
   - Non-linear easing functions look pretty, but reduce predictability.

---

In the breathing cycle there are 4 phases:
 - Inhale
 - Hold Inhale
 - Exhale
 - Hole Exhale

Initially I tried getting the user to impart that information through complex button clicking, but it proved onerous. To simplify, I made assumptions about the hold timings, reducing the input problem to just inhale/exhale timing.

With the user's current breathing pattern, it was relatively simple to make subtle changes to that pattern every cycle to nudge it toward their target pattern. My only concern is that it can be too subtle and effective, leading the user to believe it's only mirroring them, not actually doing anything.