import type { ResumePageDensity } from '@/lib/resume/pageLayout';

export interface ResumeTemplateLayoutConfig {
  personalInfoGap: string;
  personalInfoRowPadding: string;
  sectionTitleMarginBottom: string;
}

const layoutConfigByDensity: Record<ResumePageDensity, ResumeTemplateLayoutConfig> = {
  relaxed: {
    personalInfoGap: '14px',
    personalInfoRowPadding: '4px 0',
    sectionTitleMarginBottom: '10px',
  },
  normal: {
    personalInfoGap: '12px',
    personalInfoRowPadding: '4px 0',
    sectionTitleMarginBottom: '9px',
  },
  compact: {
    personalInfoGap: '10px',
    personalInfoRowPadding: '2px 0',
    sectionTitleMarginBottom: '8px',
  },
  tight: {
    personalInfoGap: '8px',
    personalInfoRowPadding: '2px 0',
    sectionTitleMarginBottom: '7px',
  },
  overflow: {
    personalInfoGap: '8px',
    personalInfoRowPadding: '2px 0',
    sectionTitleMarginBottom: '7px',
  },
};

export function getResumeTemplateLayoutConfig(density: ResumePageDensity): ResumeTemplateLayoutConfig {
  return layoutConfigByDensity[density];
}
