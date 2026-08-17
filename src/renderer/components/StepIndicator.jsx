import React from 'react';

export const StepIndicator = ({ currentStep }) => {
    const steps = [
        { id: 'portal', label: 'Portal Setup' },
        { id: 'review', label: 'Review' },
        { id: 'complete', label: 'Complete' }
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="step-indicator-container">
            {steps.map((step, index) => (
                <div key={step.id} className="step-item">
                    <div className={`step-circle ${index <= currentIndex ? 'active' : ''}`}>
                        {index + 1}
                    </div>
                    <div className={`step-label ${index <= currentIndex ? 'active' : ''}`}>
                        {step.label}
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`step-line ${index < currentIndex ? 'active' : ''}`} />
                    )}
                </div>
            ))}
        </div>
    );
};