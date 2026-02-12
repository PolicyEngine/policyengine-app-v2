# %% [markdown]
# # Validating PolicyEngine unemployment insurance estimates
#
# This notebook compares PolicyEngine's UI estimates against administrative data.

# %%
from policyengine_us import Microsimulation
import pandas as pd

# %% [markdown]
# ## PolicyEngine estimates (2025)

# %%
sim = Microsimulation(dataset="enhanced_cps_2024")
sim.default_calculation_period = 2025

# Total UI benefits
pe_total_benefits = sim.calculate("unemployment_compensation").sum() / 1e9
print(f"PolicyEngine total UI benefits: ${pe_total_benefits:.1f}B")

# Recipients (people with UI > 0)
ui = sim.calculate("unemployment_compensation")
weights = sim.calculate("person_weight")
pe_recipients = (weights * (ui > 0)).sum() / 1e6
print(f"PolicyEngine UI recipients: {pe_recipients:.1f}M")

# %% [markdown]
# ## Administrative totals
#
# Sources:
# - CBO Budget Projections (March 2024): https://www.cbo.gov/data/budget-economic-data
# - DOL UI Data Summary: https://oui.doleta.gov/unemploy/claimssum.asp

# %%
# CBO projects $40B in UI benefits for 2025
cbo_total = 40.0  # billions

# DOL historical data suggests ~5.4M recipients annually in non-recession years
dol_recipients = 5.4  # millions

print(f"CBO projected UI benefits: ${cbo_total:.1f}B")
print(f"DOL estimated recipients: {dol_recipients:.1f}M")

# %% [markdown]
# ## Raw CPS comparison

# %%
# Raw CPS without enhancement
sim_raw = Microsimulation(dataset="cps_2024")
sim_raw.default_calculation_period = 2025

raw_total = sim_raw.calculate("unemployment_compensation").sum() / 1e9
ui_raw = sim_raw.calculate("unemployment_compensation")
weights_raw = sim_raw.calculate("person_weight")
raw_recipients = (weights_raw * (ui_raw > 0)).sum() / 1e6

print(f"Raw CPS total UI benefits: ${raw_total:.1f}B")
print(f"Raw CPS UI recipients: {raw_recipients:.1f}M")

# %% [markdown]
# ## Summary comparison

# %%
comparison = pd.DataFrame({
    "Source": ["Raw CPS", "External (CBO/DOL)", "PolicyEngine"],
    "Total Benefits ($B)": [raw_total, cbo_total, pe_total_benefits],
    "Recipients (M)": [raw_recipients, dol_recipients, pe_recipients]
})
comparison = comparison.round(1)
print(comparison.to_markdown(index=False))

# %% [markdown]
# ## Deviation from admin totals

# %%
pe_benefits_pct = (pe_total_benefits - cbo_total) / cbo_total * 100
pe_recipients_pct = (pe_recipients - dol_recipients) / dol_recipients * 100
raw_benefits_pct = (raw_total - cbo_total) / cbo_total * 100
raw_recipients_pct = (raw_recipients - dol_recipients) / dol_recipients * 100

print(f"PolicyEngine vs admin:")
print(f"  Benefits: {pe_benefits_pct:+.1f}%")
print(f"  Recipients: {pe_recipients_pct:+.1f}%")
print(f"\nRaw CPS vs admin:")
print(f"  Benefits: {raw_benefits_pct:+.1f}%")
print(f"  Recipients: {raw_recipients_pct:+.1f}%")
