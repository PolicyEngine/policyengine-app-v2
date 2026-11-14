PolicyEngine merged 2,454 pull requests in October 2026, nearly 12 times as many as in October 2025. GitHub runs our tests on each pull request as jobs on its own servers, which it calls runners, and on its Team plan it runs up to 60 of an organization's jobs at once. From October 9 to 22, we ran 60 or more jobs at once for at least 67 hours, and jobs on pull requests to our US model waited a median 22 minutes to start.

On October 23, we moved to GitHub Enterprise Cloud, which runs up to 500 jobs at once. Ziming Hua also lifted caps we had set on two of our test suites and split our longest tests across parallel jobs. In the two weeks after, jobs on the US model started in a median 3 seconds, and checks that passed on the first try took a median 66 minutes, down from 2.4 hours.

```chart
{
  "type": "bar",
  "title": "Pull requests PolicyEngine merged each month",
  "subtitle": "Every repository in the PolicyEngine organization on GitHub, public and private",
  "xKey": "month",
  "series": [{ "key": "merged", "name": "Merged pull requests", "color": "primary" }],
  "data": [
    { "month": "Oct 2025", "merged": 212 },
    { "month": "Nov", "merged": 269 },
    { "month": "Dec", "merged": 354 },
    { "month": "Jan", "merged": 351 },
    { "month": "Feb", "merged": 502 },
    { "month": "Mar", "merged": 549 },
    { "month": "Apr", "merged": 1058 },
    { "month": "May", "merged": 1313 },
    { "month": "Jun", "merged": 848 },
    { "month": "Jul", "merged": 1496 },
    { "month": "Aug", "merged": 773 },
    { "month": "Sep", "merged": 995 },
    { "month": "Oct 2026", "merged": 2454 }
  ],
  "legend": false,
  "valueLabels": false,
  "format": { "decimals": 0 },
  "source": "Source: GitHub search API, counted November 8, 2026."
}
```

## Where the time went

GitHub applies the 60-job limit across all of an organization's repositories ([GitHub's Actions limits](https://docs.github.com/en/actions/reference/limits)). We pulled the record of every job that ran on GitHub's standard runners in 12 of our repositories, for runs created from October 9 to 22: 57,357 jobs in all. Those repositories ran 60 or more jobs at once in 4,025 of the 20,160 minutes, or 67 hours, and 55 or more in nearly half of them. In 60% of the minutes, at least one job waited to start. Jobs in our other repositories count toward the limit too, so the organization as a whole ran at least this many.

A job's wait depended on how many jobs were already running when GitHub created it. Jobs created while fewer than 45 were running started in a median 2 seconds. With 55 to 59 running, the median wait rose to 23 minutes, and with 60 or more, to 27 minutes.

```chart
{
  "type": "bar",
  "title": "Jobs that waited more than 5 minutes to start",
  "subtitle": "By the number of jobs running when GitHub created the job, in 12 PolicyEngine repositories, October 9 to 22, 2026",
  "xKey": "running",
  "series": [{ "key": "share", "name": "Jobs that waited more than 5 minutes", "color": "primary" }],
  "data": [
    { "running": "Fewer than 30", "share": 3.5 },
    { "running": "30 to 44", "share": 3.0 },
    { "running": "45 to 54", "share": 27.2 },
    { "running": "55 to 59", "share": 80.1 },
    { "running": "60 or more", "share": 81.8 }
  ],
  "legend": false,
  "format": { "decimals": 0, "suffix": "%" },
  "source": "Source: GitHub Actions API, jobs on GitHub's standard runners. Leaves out the US model's Baseline and Contrib jobs created after our own caps took effect on October 15."
}
```

We had held some jobs back ourselves. On October 15, Ziming capped two of the US model's test suites, Baseline and Contrib, at six jobs at a time on each pull request, so that pull requests would share the 60 runners ([policyengine-us#10231](https://github.com/PolicyEngine/policyengine-us/pull/10231)). Jobs outside those suites waited too: a median 4.2 minutes in runs created before the caps, and 11.3 minutes in runs created after.

## What we changed

Three changes landed over October 23 and 24:

- By 16:25 UTC on October 23, our organization ran on GitHub Enterprise Cloud, which runs up to 500 jobs at once on standard runners.
- At 22:05 UTC, Ziming removed the six-job caps ([policyengine-us#10416](https://github.com/PolicyEngine/policyengine-us/pull/10416)).
- At 01:30 UTC on October 24, he split the Rest Python tests, the longest path through the US model's checks, from two runners in sequence into 4 to 12 parallel shards, which a planning job balances from recent test timings ([policyengine-us#10439](https://github.com/PolicyEngine/policyengine-us/pull/10439)). In the two weeks after, those tests used a median 177 runner-minutes per run, against 99 before, and finished sooner because the shards ran side by side.

We compare the two weeks before these changes with the two weeks after, leaving out October 23 and 24, and we don't split the gain among the three.

## What changed for pull requests

From each two-week window, we drew 200 random runs of the checks on pull requests to the US model, among runs that finished with a pass or a fail.

**Table 1: Checks on pull requests to PolicyEngine's US model, before and after the changes**

| | October 9 to 22 | October 25 to November 7 |
| --- | ---: | ---: |
| GitHub plan | Team | Enterprise Cloud |
| Jobs GitHub runs at once | 60 | 500 |
| Median wait for a runner | 22 minutes (16 to 27) | 3 seconds (3 to 3) |
| Jobs that waited more than 5 minutes | 68% | 0.1% |
| Runs that passed on the first try | 133 of 200 | 165 of 200 |
| Median time for those runs to pass | 141 minutes (126 to 156) | 66 minutes (64 to 67) |

Parentheses give 95% intervals from a bootstrap that resamples runs.

![Each dot marks one run of the checks on a pull request to PolicyEngine's US model that passed on the first try. From October 9 to 22, 2026, under GitHub Team's limit of 60 jobs at once, the 133 runs spread from about 50 minutes to 6.5 hours, with a median of 2.4 hours. From October 25 to November 7, under GitHub Enterprise's limit of 500, with the six-job caps lifted and the longest tests split across parallel jobs, the 165 runs fall between 56 and 93 minutes, with a median of 66 minutes.](/assets/posts/github-actions-60-job-limit/us-pr-check-time.webp)

Before the changes, runs that passed on the first try took from about 50 minutes to 6.5 hours. After them, all 165 took between 56 and 93 minutes.

## How we measured

A job's wait runs from GitHub creating the job to a runner starting it, and a run's time to pass runs from the creation of its first job to the completion of its last. When someone re-runs part of a run, GitHub's jobs API lists the jobs that the new attempt carries over a second time, under new job IDs but with the original runner and start and end times. We count each of those jobs once.

We publish the code, data and charts at [github.com/PolicyEngine/ci-capacity-analysis](https://github.com/PolicyEngine/ci-capacity-analysis).
