import { useState } from 'react';
import { usePluginContext } from '../context';
import type { ZipStep } from '../zip/types';
import { pickZipFile, buildExtractDir, extractAndVerify } from '../zip/extract';
import { validateWeWebExport } from '../zip/discover';
import { analyzeSite } from '../analysis/analyze';
import type { SiteAnalysis } from '../analysis/types';
import type { DesignSystem } from '../design/types';
import type { AssetManifest } from '../assets/types';

type AnalysisResult = {
  siteAnalysis: SiteAnalysis;
  designSystem: DesignSystem;
  assetManifest: AssetManifest;
};

export function MainView() {
  const [step, setStep] = useState<ZipStep>({ kind: 'idle' });
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const ctx = usePluginContext();

  if (!ctx) {
    return <div className="ww2c-progress">Plugin context not available</div>;
  }

  const startPickFlow = async () => {
    try {
      setResult(null);
      setStep({ kind: 'picking' });
      const zipPath = await pickZipFile(ctx.shell);
      if (!zipPath) {
        setStep({ kind: 'idle' });
        return;
      }

      setStep({ kind: 'extracting', fileCount: 0 });
      const extractDir = buildExtractDir(ctx.project.path, zipPath);
      const manifest = await extractAndVerify(ctx.shell, zipPath, extractDir, (_label) => {
        // Progress callback — fileCount not yet known until manifest resolves
        setStep({ kind: 'extracting', fileCount: 0 });
      });

      setStep({ kind: 'validating' });
      await validateWeWebExport(ctx.shell, extractDir, manifest.entries);

      // Full analysis pipeline: design tokens -> page parsing -> tree walking ->
      // workflow parsing -> shared detection -> asset copy
      const analysisResult = await analyzeSite(
        ctx.shell,
        extractDir,
        manifest.entries,
        ctx.project.path,
        setStep,
      );

      setResult(analysisResult);
      setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount });
    } catch (err) {
      setStep({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const checkAndPick = async () => {
    const result = await ctx.shell.exec('bash', [
      '-c',
      `test -d '${ctx.project.path}/.shipstudio' && echo exists || echo none`,
    ]);
    if (result.stdout.trim() === 'exists') {
      setShowConfirm(true);
    } else {
      startPickFlow();
    }
  };

  if (showConfirm) {
    return (
      <div>
        <p className="ww2c-progress">Existing migration found. Start fresh?</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            className="ww2c-btn-ghost"
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="ww2c-btn-ghost"
            onClick={() => {
              setShowConfirm(false);
              startPickFlow();
            }}
          >
            Start Fresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {step.kind === 'idle' && (
        <button
          className="ww2c-btn-ghost"
          onClick={checkAndPick}
          style={{ width: '100%' }}
        >
          Select WeWeb Export ZIP
        </button>
      )}

      {step.kind === 'picking' && (
        <div className="ww2c-progress">Opening file picker...</div>
      )}

      {step.kind === 'extracting' && (
        <div className="ww2c-progress">Extracting ZIP...</div>
      )}

      {step.kind === 'validating' && (
        <div className="ww2c-progress">Validating WeWeb export...</div>
      )}

      {step.kind === 'copying' && (
        <div className="ww2c-progress">{step.label}</div>
      )}

      {step.kind === 'analyzing' && (
        <div className="ww2c-progress">Analyzing pages... ({step.pageCount})</div>
      )}

      {step.kind === 'generating' && (
        <div className="ww2c-progress">Generating brief...</div>
      )}

      {step.kind === 'done' && result && (
        <>
          <div className="ww2c-progress ww2c-progress-done">
            Analysis complete: {result.siteAnalysis.pages.length} pages,{' '}
            {result.siteAnalysis.totalComponentCount} components,{' '}
            {result.designSystem.fonts.length + result.designSystem.colors.length + result.designSystem.dimensions.length} design tokens,{' '}
            {result.assetManifest.totalCopied} assets copied
          </div>
          <button
            className="ww2c-btn-ghost"
            onClick={() => { setStep({ kind: 'idle' }); setResult(null); }}
            style={{ marginTop: '8px' }}
          >
            Select Another
          </button>
        </>
      )}

      {step.kind === 'error' && (
        <>
          <div className="ww2c-error">{step.message}</div>
          <button
            className="ww2c-btn-ghost"
            onClick={() => setStep({ kind: 'idle' })}
            style={{ marginTop: '8px' }}
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
