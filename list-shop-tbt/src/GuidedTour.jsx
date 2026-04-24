import { useEffect, useState } from 'react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getTooltipStyle(targetRect) {
  if (!targetRect) {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const tooltipWidth = Math.min(window.innerWidth - 32, 320)
  const left = clamp(
    targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
    16,
    window.innerWidth - tooltipWidth - 16,
  )
  const shouldRenderBelow = targetRect.bottom + 220 < window.innerHeight
  const top = shouldRenderBelow
    ? targetRect.bottom + 16
    : Math.max(16, targetRect.top - 200)

  return {
    left,
    top,
    width: tooltipWidth,
  }
}

export default function GuidedTour({
  isOpen,
  step,
  stepIndex,
  stepCount,
  onNext,
  onPrev,
  onSkip,
}) {
  const [targetBox, setTargetBox] = useState(null)
  const targetRect = isOpen && targetBox?.stepId === step?.id ? targetBox.rect : null
  const tooltipStyle = getTooltipStyle(targetRect)

  useEffect(() => {
    if (!isOpen || !step?.selector) {
      return undefined
    }

    let targetElement = null
    let retryId = 0
    let frameId = 0
    let settleId = 0
    let isCancelled = false

    function removeHighlight() {
      targetElement?.classList.remove('tour-highlight')
      targetElement = null
    }

    function updateTargetRect() {
      if (!targetElement || isCancelled) {
        return
      }

      const rect = targetElement.getBoundingClientRect()

      setTargetBox({
        stepId: step.id,
        rect: {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      })
    }

    function applyHighlight() {
      const nextTarget = document.querySelector(step.selector)

      if (!nextTarget) {
        setTargetBox(null)
        retryId = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(applyHighlight)
        }, 120)
        return
      }

      if (targetElement !== nextTarget) {
        removeHighlight()
        targetElement = nextTarget
        targetElement.classList.add('tour-highlight')
      }

      targetElement.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'smooth',
      })

      updateTargetRect()
      settleId = window.setTimeout(updateTargetRect, 280)
    }

    frameId = window.requestAnimationFrame(applyHighlight)
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)

    return () => {
      isCancelled = true
      window.clearTimeout(retryId)
      window.clearTimeout(settleId)
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
      removeHighlight()
    }
  }, [isOpen, step?.id, step?.selector])

  if (!isOpen || !step) {
    return null
  }

  return (
    <>
      <div className="tour-backdrop" />
      {targetRect ? (
        <div
          className="tour-focus-ring"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : null}

      <aside className="tour-card" style={tooltipStyle}>
        <div className="tour-card-head">
          <span className="tour-step-counter">
            {stepIndex + 1} / {stepCount}
          </span>
          <button type="button" className="link-button" onClick={onSkip}>
            Fechar guia
          </button>
        </div>

        <div className="tour-copy">
          <strong>{step.title}</strong>
          <p>{step.body}</p>
        </div>

        <div className="tour-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onPrev}
            disabled={stepIndex === 0}
          >
            Anterior
          </button>

          <button type="button" className="primary-button" onClick={onNext}>
            {stepIndex === stepCount - 1 ? 'Concluir' : 'Proximo'}
          </button>
        </div>
      </aside>
    </>
  )
}
