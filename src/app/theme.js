// Central design system for HealthConnect.
// A deep-teal "clinical" identity: colored sidebar, tinted table headers,
// spacious content. Change BRAND below to re-skin the whole app in one place.

export const BRAND = {
  primary: '#0F766E', // deep teal — buttons, links, active states
  primaryBright: '#14B8A6', // accents / gradients
  sider: '#0B3B37', // sidebar (navbar) background
  siderActive: '#127C70', // active nav item
  heading: '#0B3B37', // dark teal text for titles
  pageBg: '#F3F6F5', // app content background (so white cards pop)
  border: '#E7EDEB',
}

const FONT_STACK =
  "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"

export const appTheme = {
  token: {
    colorPrimary: BRAND.primary,
    colorInfo: BRAND.primary,
    colorLink: BRAND.primary,
    colorLinkHover: BRAND.primaryBright,
    colorTextHeading: BRAND.heading,
    borderRadius: 8,
    fontFamily: FONT_STACK,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 64,
      headerPadding: '0 28px',
      bodyBg: BRAND.pageBg,
      siderBg: BRAND.sider,
    },
    Menu: {
      darkItemBg: BRAND.sider,
      darkSubMenuItemBg: BRAND.sider,
      darkItemColor: 'rgba(255, 255, 255, 0.72)',
      darkItemHoverColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
      darkItemSelectedBg: BRAND.siderActive,
      darkItemSelectedColor: '#FFFFFF',
      itemHeight: 46,
      itemMarginInline: 12,
      itemBorderRadius: 10,
      iconSize: 18,
    },
    Table: {
      headerBg: '#ECF3F1',
      headerColor: BRAND.heading,
      headerSplitColor: 'transparent',
      borderColor: BRAND.border,
      rowHoverBg: '#F0F7F5',
      cellPaddingBlock: 15,
      cellPaddingInline: 20,
      fontSize: 14,
    },
    Button: {
      controlHeight: 38,
      controlHeightSM: 30,
      borderRadius: 8,
      primaryShadow: 'none',
      defaultShadow: 'none',
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 14,
      colorBorderSecondary: BRAND.border,
    },
    Input: { controlHeight: 38, borderRadius: 8 },
    Select: { controlHeight: 38, borderRadius: 8 },
    Modal: { borderRadiusLG: 16 },
    Pagination: { borderRadius: 8 },
  },
}
