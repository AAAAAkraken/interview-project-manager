'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, Ref } from 'react';
import { getResumeTemplate } from '@/lib/resume/templates';
import { isPersonalInfoSection, parsePersonalInfoRows } from '@/lib/resume/personalInfo';
import {
  estimateResumePageCount,
  getResumePageDensity,
  getResumePageDensityClass,
  getResumePageWarning,
  normalizeResumePageCount,
  shouldShowResumePageWarning,
} from '@/lib/resume/pageLayout';
import { getResumeTemplateLayoutConfig } from '@/lib/resume/templateLayout';
import type { ResumeDocument } from '@/types/resume';

const A4_PAGE_HEIGHT_PX = 1123;

export function ResumeTemplatePreview({
  resume,
  print = false,
}: {
  resume: ResumeDocument;
  print?: boolean;
}) {
  const template = getResumeTemplate(resume.templateId);
  const enabledSections = resume.sections.filter(section => section.enabled);
  const personalInfoSection = enabledSections.find(section => isPersonalInfoSection(section));
  const otherSections = enabledSections.filter(section => section.id !== personalInfoSection?.id);
  const targetPages = normalizeResumePageCount(resume.pageCount);
  const estimatedPages = estimateResumePageCount(resume);
  const density = getResumePageDensity(targetPages, estimatedPages);
  const layout = getResumeTemplateLayoutConfig(density);
  const measurementRef = useRef<HTMLElement | null>(null);
  const [measuredPages, setMeasuredPages] = useState<number | null>(null);
  const style = {
    '--resume-basic-gap': layout.personalInfoGap,
    '--resume-basic-row-padding': layout.personalInfoRowPadding,
    '--resume-section-title-margin-bottom': layout.sectionTitleMarginBottom,
  } as CSSProperties;

  useLayoutEffect(() => {
    if (print) return;
    const el = measurementRef.current;
    if (!el) return;
    const nextMeasuredPages = Math.max(1, Math.ceil(el.scrollHeight / A4_PAGE_HEIGHT_PX));
    setMeasuredPages(prev => (prev === nextMeasuredPages ? prev : nextMeasuredPages));
  }, [density, print, resume]);

  const warning = measuredPages === null
    ? ''
    : getResumePageWarning(targetPages, getResumePageDensity(targetPages, measuredPages));

  const renderCard = (warningVisible: boolean, ref?: Ref<HTMLElement>) => (
    <article
      ref={ref}
      className={`resume-template-page ${template.accentClass} ${getResumePageDensityClass(density)} resume-target-pages-${targetPages} ${print ? 'resume-template-print' : ''}`}
      style={style}
    >
      {warningVisible && <div className="resume-template-warning">{warning}</div>}

      <header className="resume-template-header">
        <div className="resume-template-heading">
          <div className="resume-template-heading-text">
            <h1>{resume.name || '未命名简历'}</h1>
            {resume.targetRole && <p>{resume.targetRole}</p>}
          </div>
          {!personalInfoSection && (
            <div className="resume-template-photo">
              {resume.photoDataUrl ? <img src={resume.photoDataUrl} alt="简历照片" /> : <span>照片</span>}
            </div>
          )}
        </div>
      </header>

      <div className="resume-template-body">
        {personalInfoSection && (
          <section className={`resume-template-section resume-template-basic-section resume-section-${personalInfoSection.type}`}>
            <h2><span className="resume-template-section-title">{personalInfoSection.title || '基本信息'}</span></h2>
            <div className="resume-template-basic-layout">
              <div className="resume-template-basic-content">
                {personalInfoSection.content.trim() ? (
                  <div className="resume-template-basic-rows">
                    {parsePersonalInfoRows(personalInfoSection.content).map(row => (
                      <div
                        key={row.id}
                        className={`resume-template-basic-row ${row.cells.length > 1 ? 'resume-template-basic-row--split' : ''}`}
                      >
                        {row.cells.map((cell, index) => (
                          <span key={`${row.id}-${index}`} className="resume-template-basic-cell">
                            {cell}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="resume-template-empty">暂无内容</p>
                )}
              </div>
              <div className="resume-template-photo">
                {resume.photoDataUrl ? <img src={resume.photoDataUrl} alt="简历照片" /> : <span>照片</span>}
              </div>
            </div>
          </section>
        )}

        {enabledSections.length === 0 ? (
          <section className="resume-template-section">
            <h2><span className="resume-template-section-title">简历内容</span></h2>
            <p className="resume-template-empty">暂无内容</p>
          </section>
        ) : otherSections.map(section => (
          <section key={section.id} className={`resume-template-section resume-section-${section.type}`}>
            <h2><span className="resume-template-section-title">{section.title || '未命名模块'}</span></h2>
            <div className="resume-template-content">
              {section.content.split(/\r?\n/).map((line, index) => (
                <p key={`${section.id}-${index}`}>{line || '\u00a0'}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );

  return (
    <>
      {renderCard(shouldShowResumePageWarning(print, warning))}
      {!print && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {renderCard(false, measurementRef as Ref<HTMLElement>)}
        </div>
      )}
    </>
  );
}
