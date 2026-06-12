import type { GlobalToken } from 'antd/es/theme/interface';
import type { CSSProperties } from 'react';

/** Map Ant Design token → CSS variables cho drill UI. */
export function drillAntdCssVars(token: GlobalToken): CSSProperties {
	return {
		'--drill-bg-layout': token.colorBgLayout,
		'--drill-bg-container': token.colorBgContainer,
		'--drill-bg-spot': token.colorFillAlter,
		'--drill-border': token.colorBorder,
		'--drill-border-secondary': token.colorBorderSecondary,
		'--drill-primary': token.colorPrimary,
		'--drill-primary-bg': token.colorPrimaryBg,
		'--drill-primary-border': token.colorPrimaryBorder,
		'--drill-success': token.colorSuccess,
		'--drill-success-bg': token.colorSuccessBg,
		'--drill-error': token.colorError,
		'--drill-error-bg': token.colorErrorBg,
		'--drill-warning': token.colorWarning,
		'--drill-text': token.colorText,
		'--drill-text-secondary': token.colorTextSecondary,
		'--drill-text-tertiary': token.colorTextTertiary,
		'--drill-shadow': token.boxShadowSecondary,
		'--drill-shadow-card': token.boxShadow,
		'--drill-radius-lg': `${token.borderRadiusLG}px`,
		'--drill-radius-md': `${token.borderRadius}px`,
		'--drill-radius-sm': `${token.borderRadiusSM}px`,
	} as CSSProperties;
}
