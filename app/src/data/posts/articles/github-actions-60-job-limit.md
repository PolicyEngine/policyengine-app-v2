PolicyEngine merged 2,454 pull requests in October 2026, 11.6 times as many as in October 2025. GitHub Actions runs the automated checks on each pull request as a set of jobs, and on its Team plan it runs up to 60 of an organization's jobs at once ([GitHub's Actions limits](https://docs.github.com/en/actions/reference/limits)). From October 9 to 22, we hit that limit for at least 67 hours. For example, jobs on pull requests to our US model waited a median 22 minutes to start, partly behind caps we had set.

On October 23, we moved to GitHub Enterprise Cloud, which runs up to 500 jobs at once. Ziming Hua also lifted those caps and split the US model's longest tests across parallel jobs. In the two weeks after, jobs on pull requests to the US model started in a median 3 seconds. Checks that passed on the first try finished in a median 66 minutes, down from 2.4 hours.

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
  "format": { "decimals": 0, "separator": true },
  "source": "Source: GitHub search API, counted November 8, 2026."
}
```

## Where the time went

We pulled the record of every job that ran on GitHub's standard runners in 12 of our repositories, for runs created from October 9 to 22: 57,357 jobs in all. Together, those repositories reached 60 jobs at once in 4,025 of the 20,160 minutes, or 67 hours, and almost never went past it, so the limit covered the 12 together. They ran 55 or more in 9,842 minutes, nearly half of the two weeks. Jobs in our other repositories count toward the limit too, so the organization as a whole ran at least this many.

Jobs that GitHub created while fewer than 45 were running started in a median 2 seconds. With 55 to 59 running, the median wait rose to 23 minutes, and at the limit, to 27 minutes.

```chart
{
  "type": "bar",
  "title": "Jobs that waited more than 5 minutes to start",
  "subtitle": "By the number of jobs running when GitHub created the job, in 12 PolicyEngine repositories, October 9 to 22, 2026",
  "xKey": "running",
  "series": [{ "key": "share", "name": "Jobs that waited more than 5 minutes", "color": "primary" }],
  "data": [
    { "running": "Fewer than 30", "share": 3.47 },
    { "running": "30 to 44", "share": 3.04 },
    { "running": "45 to 54", "share": 27.16 },
    { "running": "55 to 59", "share": 80.15 },
    { "running": "At the limit (60)", "share": 81.75 }
  ],
  "legend": false,
  "format": { "decimals": 0, "suffix": "%" },
  "source": "Source: GitHub Actions API, jobs on GitHub's standard runners. We leave out the US model's Baseline and Contrib jobs created after our caps took effect on October 15."
}
```

On October 15, Ziming capped the US model's Baseline and Contrib test suites at six jobs at a time per pull request, so pull requests would share the 60-job limit ([policyengine-us#10231](https://github.com/PolicyEngine/policyengine-us/pull/10231)). Before then, in the runs we sampled, jobs in those suites already waited a median 18.7 minutes to start, and the model's other jobs 4.2 minutes. After that, Baseline and Contrib jobs also waited their turn under the caps, and the model's other jobs waited a median 11.3 minutes.

## What we changed

We made three changes on October 23 and 24:

- We moved our organization to GitHub Enterprise Cloud.
- Ziming removed the six-job caps ([policyengine-us#10416](https://github.com/PolicyEngine/policyengine-us/pull/10416)).
- Ziming split the Rest Python tests, which set the length of the US model's checks, from two jobs in sequence into 4 to 12 parallel jobs ([policyengine-us#10439](https://github.com/PolicyEngine/policyengine-us/pull/10439)). A first job divides the tests among them by how long each took in recent runs.

We compare the two weeks before these changes with the two weeks after, leaving out October 23 and 24, and we don't divide the gain among the three.

## What changed for pull requests

From each two-week window, we drew 200 random runs of the checks on pull requests to the US model, among runs that finished with a pass or a fail. We time the runs that passed on the first try: 133 before the changes and 165 after.

**Table 1: Checks on pull requests to PolicyEngine's US model, before and after the changes**

| | October 9 to 22 | October 25 to November 7 |
| --- | ---: | ---: |
| GitHub plan | Team | Enterprise Cloud |
| Jobs GitHub runs at once | 60 | 500 |
| Median wait for a job to start | 22 minutes (16 to 27) | 3 seconds |
| Jobs that waited more than 5 minutes | 68% | 0.1% |
| Median time for a run that passed on the first try | 2.4 hours (2.1 to 2.6) | 66 minutes (64 to 67) |

Parentheses give 95% intervals from a bootstrap that resamples runs, and after the changes every resample gave a median wait of 3 seconds. From October 15, the waits before the changes include time our caps held Baseline and Contrib jobs. Without those jobs, the rest waited a median 13 minutes, and 60% of them waited more than 5 minutes.

![Each dot marks one run of the checks on a pull request to PolicyEngine's US model that passed on the first try, among 200 random runs per period. From October 9 to 22, 2026, under GitHub Team's limit of 60 jobs at once, the 133 runs took from about 50 minutes to 6.5 hours, with a median of 2.4 hours. From October 25 to November 7, PolicyEngine used GitHub Enterprise Cloud, with a limit of 500. By then, Ziming Hua had lifted the six-job caps and split the longest tests across parallel jobs. Those 165 runs took between 56 and 93 minutes, with a median of 66 minutes.](/assets/posts/github-actions-60-job-limit/us-pr-check-time.webp)

Before the changes, runs that passed on the first try took from about 50 minutes to 6.5 hours. After them, all 165 sampled runs took between 56 and 93 minutes.

## How we measured

We measure a job's wait from GitHub creating the job to a runner starting it, and a run's time from GitHub creating its first job to its last job finishing. We publish the code, data and charts at [github.com/PolicyEngine/ci-capacity-analysis](https://github.com/PolicyEngine/ci-capacity-analysis).
