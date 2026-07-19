---
title: i built a job queue to understand backpressure
date: jun 26, 2025
category: systems / backend
readTime: 12 min read
description: the boring parts of software are usually the important parts.
tags: go, backend, reliability, system design
---

## the useful problem

A job queue is easy to describe and surprisingly hard to make feel good. Put work in one end, take it out of the other, retry when things break, and call it a day. The interesting part starts when work arrives faster than the system can finish it.

This is the point where a queue stops being a list and starts being a pressure valve. It buys the system time. More importantly, it gives us a place to make a deliberate decision about what happens when there is too much of that time to buy.

> backpressure is the system asking for a slower conversation.

## a small mental model

There are only three rates that matter here: how quickly jobs arrive, how quickly workers can process them, and how much work the system can hold while the two disagree.

```go
for job := range queue {
    if err := process(job); err != nil {
        retryOrMoveToDeadLetter(job, err)
        continue
    }
    metrics.Completed.Inc()
}
```

Once I wrote the rates down, several design choices became less mysterious. A bounded queue was no longer an arbitrary limit. It was an honest statement about how much waiting the product could tolerate.

## where queues fail

A queue can hide a problem just as effectively as it can absorb one. The fixes were not especially glamorous:

- cap the queue and make rejection observable;
- give every job a deadline, not just a retry count;
- separate retryable failures from failures that need a human;
- measure time spent waiting as carefully as time spent working.

## shipping the boring version

The final implementation had fewer moving parts than the first draft. A bounded channel, a worker loop, an explicit retry policy, and a dead-letter store were enough. The queue did not try to make every job succeed. It made the failure path predictable.

That predictability is the part I would ship again. When a system is under pressure, the best abstraction is usually the one that makes the next decision obvious.

## recap

A queue is not a performance feature. It is a contract about waiting, capacity, and failure. Build the smallest version that tells the truth, then add complexity only when the system gives you a reason.
