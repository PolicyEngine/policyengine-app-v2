import { ParameterMetadata } from '@/types/parameter';

export const mockParamMetadata: {"parameters": ParameterMetadata} = {
  "parameters": {
    "gov": {
      "type": "parameterNode",
      "parameter": "gov",
      "description": null,
      "label": "Government",
      "economy": true,
      "household": true
    },
    "gov.aca.max_child_count": {
      "type": "parameter",
      "parameter": "gov.aca.max_child_count",
      "description": "Maximum number of children who pay an age-based ACA plan premium. This parameter is yearly.",
      "label": "ACA maximum child count",
      "unit": null,
      "period": null,
      "values": {
        "2014-01-01": 3
      },
      "economy": true,
      "household": true
    },
    "gov.states": {
      "type": "parameterNode",
      "parameter": "gov.states",
      "description": null,
      "label": "States",
      "economy": true,
      "household": true
    },
    "gov.states.de": {
      "type": "parameterNode",
      "parameter": "gov.states.de",
      "description": null,
      "label": "Delaware",
      "economy": true,
      "household": true
    },
    "gov.states.de.tax": {
      "type": "parameterNode",
      "parameter": "gov.states.de.tax",
      "description": null,
      "label": "tax",
      "economy": true,
      "household": true
    },
    "gov.states.de.tax.income": {
      "type": "parameterNode",
      "parameter": "gov.states.de.tax.income",
      "description": null,
      "label": "income",
      "economy": true,
      "household": true
    },
    "gov.states.de.tax.income.rate": {
      "type": "parameterNode",
      "parameter": "gov.states.de.tax.income.rate",
      "description": "Delaware taxes personal income according to this rate schedule.",
      "label": "Delaware personal income tax rate"
    },
    "gov.states.de.tax.income.rate[0]": {
      "type": "parameterNode",
      "parameter": "gov.states.de.tax.income.rate[0]",
      "description": null,
      "label": "bracket 1"
    },
    "gov.states.de.tax.income.rate[0].threshold": {
      "type": "parameter",
      "parameter": "gov.states.de.tax.income.rate[0].threshold",
      "description": null,
      "label": "threshold",
      "unit": "currency-USD",
      "period": null,
      "values": {
        "1996-01-01": 0
      },
      "economy": true,
      "household": true
    },
    "gov.states.de.tax.income.rate[0].rate": {
      "type": "parameter",
      "parameter": "gov.states.de.tax.income.rate[0].rate",
      "description": null,
      "label": "rate",
      "unit": "/1",
      "period": null,
      "values": {
        "1996-01-01": 0
      },
      "economy": true,
      "household": true
    },
    "gov.states.de.tax.income.rate[1]": {
      "type": "parameterNode",
      "parameter": "gov.states.de.tax.income.rate[1]",
      "description": null,
      "label": "bracket 2"
    },
    "gov.states.de.tax.income.rate[1].threshold": {
      "type": "parameter",
      "parameter": "gov.states.de.tax.income.rate[1].threshold",
      "description": null,
      "label": "threshold",
      "unit": "currency-USD",
      "period": null,
      "values": {
        "1996-01-01": 2000
      },
      "economy": true,
      "household": true
    },
    "gov.states.de.tax.income.rate[1].rate": {
      "type": "parameter",
      "parameter": "gov.states.de.tax.income.rate[1].rate",
      "description": null,
      "label": "rate",
      "unit": "/1",
      "period": null,
      "values": {
        "2014-01-01": 0.022,
        "1999-01-01": 0.026,
        "1996-01-01": 0.031
      },
      "economy": true,
      "household": true
    },
    "gov.states.de.tax.income.rate[2]": {
      "type": "parameterNode",
      "parameter": "gov.states.de.tax.income.rate[2]",
      "description": null,
      "label": "bracket 3"
    },
    "gov.states.de.tax.income.rate[2].threshold": {
      "type": "parameter",
      "parameter": "gov.states.de.tax.income.rate[2].threshold",
      "description": null,
      "label": "threshold",
      "unit": "currency-USD",
      "period": null,
      "values": {
        "1996-01-01": 5000
      },
      "economy": true,
      "household": true
    }
  }
}