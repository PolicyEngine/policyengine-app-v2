// Components submodule for Mantine theme
import { componentStyles } from './componentConfig';

export const themeComponents = {
  Button: {
    variants: {
      primary: () => ({ root: componentStyles.Button.primary }),
      secondary: () => ({ root: componentStyles.Button.secondary }),
      ghost: () => ({ root: componentStyles.Button.ghost }),
      accent: () => ({ root: componentStyles.Button.accent }),
    },
  },
  
  Text: {
    variants: {
      heading: () => ({ root: componentStyles.Text.heading }),
      body: () => ({ root: componentStyles.Text.body }),
      small: () => ({ root: componentStyles.Text.small }),
      caption: () => ({ root: componentStyles.Text.caption }),
    },
  },
  
  Badge: {
    variants: {
      blue: () => ({ root: componentStyles.Badge.blue }),
      gray: () => ({ root: componentStyles.Badge.gray }),
    },
  },
};
