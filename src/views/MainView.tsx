import { useState, useEffect } from 'react';
import { usePluginContext } from '../context';
import type { ZipStep } from '../zip/types';
import { pickZipFile, buildExtractDir, extractAndVerify } from '../zip/extract';
import { validateWeWebExport } from '../zip/discover';
import { analyzeSite } from '../analysis/analyze';
import type { BriefMode, PreserveOption } from '../brief/types';
import { PRESERVE_OPTIONS, DEFAULT_PRESERVE, TOKEN_WARNING_THRESHOLD } from '../brief/types';
import { generateBrief } from '../brief/generate';
import { saveBrief, copyToClipboard } from '../brief/io';
import { generateMigrationPlan } from '../plan/generate';
import { saveMigrationPlan } from '../plan/io';
import { loadMigrationPlan } from '../plan/read';
import type { MigrationPlan } from '../plan/types';
import { MigrationProgress } from '../components/MigrationProgress';

function PreserveCheckbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="ww2c-check-item" onClick={onToggle}>
      <div className={`ww2c-checkbox${checked ? ' checked' : ''}`}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}

export function MainView() {
  const [step, setStep] = useState<ZipStep>({ kind: 'idle' });
  const [showConfirm, setShowConfirm] = useState(false);
  const [mode, setMode] = useState<BriefMode>('pixel-perfect');
  const [preserve, setPreserve] = useState<Set<PreserveOption>>(new Set(DEFAULT_PRESERVE));
  const [customNotes, setCustomNotes] = useState('');
  const [copying, setCopying] = useState(false);
  const [existingPlan, setExistingPlan] = useState<MigrationPlan | null | 'checking'>('checking');

  const ctx = usePluginContext();

  useEffect(() => {
    if (!ctx) return;
    loadMigrationPlan(ctx.shell, ctx.project.path).then((plan) => {
      setExistingPlan(plan);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ctx) {
    return <div className="ww2c-progress">Plugin context not available</div>;
  }

  const handleStartFresh = () => {
    setExistingPlan(null);
    setStep({ kind: 'idle' });
  };

  const startPickFlow = async () => {
    // Capture mode/preserve/customNotes at call time to avoid stale closure
    const currentMode = mode;
    const currentPreserve = preserve;
    const currentCustomNotes = customNotes;

    try {
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

      setStep({ kind: 'generating' });
      const briefResult = generateBrief({
        mode: currentMode,
        siteAnalysis: analysisResult.siteAnalysis,
        designSystem: analysisResult.designSystem,
        assetManifest: analysisResult.assetManifest,
        projectPath: ctx.project.path,
        preserve: currentMode === 'best-site' ? currentPreserve : undefined,
        customNotes: currentMode === 'best-site' ? currentCustomNotes : undefined,
      });

      await saveBrief(ctx.shell, ctx.project.path, briefResult.markdown);

      const plan = generateMigrationPlan(analysisResult.siteAnalysis);
      await saveMigrationPlan(ctx.shell, ctx.project.path, plan);

      setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount, briefResult });
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

  if (existingPlan === 'checking') {
    return <div className="ww2c-progress">Checking for existing migration...</div>;
  }

  if (existingPlan !== null && step.kind === 'idle') {
    return (
      <MigrationProgress
        shell={ctx.shell}
        projectPath={ctx.project.path}
        onStartFresh={handleStartFresh}
      />
    );
  }

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
        <>
          <div className="ww2c-mode-group">
            <div
              className={`ww2c-mode-card${mode === 'pixel-perfect' ? ' selected' : ''}`}
              onClick={() => setMode('pixel-perfect')}
            >
              <div className="ww2c-mode-card-name">Pixel Perfect</div>
              <div className="ww2c-mode-card-desc">Exact recreation of the original design</div>
            </div>
            <div
              className={`ww2c-mode-card${mode === 'best-site' ? ' selected' : ''}`}
              onClick={() => setMode('best-site')}
            >
              <div className="ww2c-mode-card-name">Best Site</div>
              <div className="ww2c-mode-card-desc">Modernized with best practices</div>
            </div>
          </div>

          {mode === 'best-site' && (
            <div className="ww2c-preserve-section">
              <div className="ww2c-checklist">
                {PRESERVE_OPTIONS.map((opt) => (
                  <PreserveCheckbox
                    key={opt.key}
                    label={opt.label}
                    checked={preserve.has(opt.key)}
                    onToggle={() => {
                      const next = new Set(preserve);
                      if (next.has(opt.key)) next.delete(opt.key);
                      else next.add(opt.key);
                      setPreserve(next);
                    }}
                  />
                ))}
              </div>
              <textarea
                className="ww2c-custom-notes"
                placeholder="Additional notes for the AI..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <button className="ww2c-btn-ghost" onClick={checkAndPick} style={{ width: '100%' }}>
            Select WeWeb Export ZIP
          </button>
        </>
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

      {step.kind === 'done' && (
        <div className="ww2c-results">
          <div className="ww2c-results-header">Brief Generated</div>
          <div className="ww2c-results-stats">
            {step.briefResult.stats.pageCount} pages |{' '}
            {step.briefResult.stats.totalComponentCount} components |{' '}
            {step.briefResult.stats.assetCount} assets |{' '}
            ~{Math.round(step.briefResult.estimatedTokens / 1000)}K tokens
          </div>

          {step.briefResult.estimatedTokens > TOKEN_WARNING_THRESHOLD && (
            <div className="ww2c-results-tip">
              Brief is ~{Math.round(step.briefResult.estimatedTokens / 1000)}K tokens — consider building page by page using the migration plan file.
            </div>
          )}

          <div className="ww2c-results-output">
            <div className="ww2c-results-output-label">Saved to:</div>
            <div className="ww2c-results-path">.shipstudio/assets/brief.md</div>
          </div>

          <div className="ww2c-results-output">
            <div className="ww2c-results-path">Migration plan saved to .shipstudio/migration-plan.json</div>
          </div>

          <button
            className="ww2c-btn-ghost"
            onClick={async () => {
              setCopying(true);
              try {
                await copyToClipboard(ctx.shell, step.briefResult.markdown);
              } catch {
                // Silently fail — clipboard is best-effort
              }
              setCopying(false);
            }}
            style={{ width: '100%', marginTop: '8px' }}
            disabled={copying}
          >
            {copying ? 'Copying...' : 'Copy Brief to Clipboard'}
          </button>

          <button
            className="ww2c-btn-ghost"
            onClick={() => { setStep({ kind: 'idle' }); }}
            style={{ width: '100%', marginTop: '4px' }}
          >
            Select Another
          </button>
        </div>
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
