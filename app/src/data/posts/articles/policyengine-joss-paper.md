The paper describing `policyengine`, the open-source Python package behind PolicyEngine, has been published in the [Journal of Open Source Software](https://joss.theoj.org/papers/10.21105/joss.11115) (JOSS) after peer review.

The package lets analysts work out how tax and benefit policies affect household incomes and government budgets in the UK and the US. It gives one workflow for both countries: calculate taxes and benefits for a single household, or run a microsimulation of the whole population on representative survey data, and compare current law with a proposed reform. The rules for each country live in their own packages, `policyengine-uk` and `policyengine-us`, while `policyengine` provides the shared tools for datasets, reforms, outputs and version-pinned releases, so a published estimate can be reproduced with the exact model and data that produced it.

The paper sets out why the package was built, how it compares with other microsimulation models in the UK and the US, and how it is used. It was written by Vahid Ahmadi, Max Ghenis, Nikhil Woodruff, Pavel Makarchuk and Anthony Volk, and reviewed in the open on GitHub.

## Read the paper

The paper is published under a [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) licence. You can read it below, open the [PDF](/assets/posts/policyengine-joss-paper/policyengine-joss-11115.pdf), or see it on the [JOSS website](https://joss.theoj.org/papers/10.21105/joss.11115) with its review and archive.

<div style="max-height:900px;overflow-y:auto;border:1px solid #e2e8f0;">
<img src="/assets/posts/policyengine-joss-paper/page-1.webp" alt="" width="100%" style="display:block;border-bottom:1px solid #e2e8f0;" />
<img src="/assets/posts/policyengine-joss-paper/page-2.webp" alt="" width="100%" style="display:block;border-bottom:1px solid #e2e8f0;" />
<img src="/assets/posts/policyengine-joss-paper/page-3.webp" alt="" width="100%" style="display:block;border-bottom:1px solid #e2e8f0;" />
<img src="/assets/posts/policyengine-joss-paper/page-4.webp" alt="" width="100%" style="display:block;border-bottom:1px solid #e2e8f0;" />
<img src="/assets/posts/policyengine-joss-paper/page-5.webp" alt="" width="100%" style="display:block;border-bottom:1px solid #e2e8f0;" />
<img src="/assets/posts/policyengine-joss-paper/page-6.webp" alt="" width="100%" style="display:block;border-bottom:1px solid #e2e8f0;" />
<img src="/assets/posts/policyengine-joss-paper/page-7.webp" alt="" width="100%" style="display:block;border-bottom:1px solid #e2e8f0;" />
</div>

## How to cite

If you use PolicyEngine in your work, please cite the paper:

```text
Ahmadi, V., Ghenis, M., Woodruff, N., Makarchuk, P., & Volk, A. (2026). policyengine: A Microsimulation Tool for Tax-Benefit Policy Analysis. Journal of Open Source Software, 11(125), 11115. https://doi.org/10.21105/joss.11115
```

Or in BibTeX:

```bibtex
@article{Ahmadi_2026,
  title     = {policyengine: A Microsimulation Tool for Tax-Benefit Policy Analysis},
  author    = {Ahmadi, Vahid and Ghenis, Max and Woodruff, Nikhil and Makarchuk, Pavel and Volk, Anthony},
  journal   = {Journal of Open Source Software},
  volume    = {11},
  number    = {125},
  pages     = {11115},
  year      = {2026},
  publisher = {The Open Journal},
  doi       = {10.21105/joss.11115},
  url       = {https://doi.org/10.21105/joss.11115}
}
```
