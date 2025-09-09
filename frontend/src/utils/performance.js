import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
// Performance monitoring utilities
export const performanceUtils = {
    // Development performance monitoring
    mark: (name) => {
        if (typeof window !== 'undefined' && window.performance && import.meta.env.DEV) {
            window.performance.mark(name);
        }
    },
    measure: (name, startMark, endMark) => {
        if (typeof window !== 'undefined' && window.performance && import.meta.env.DEV) {
            try {
                if (endMark) {
                    window.performance.measure(name, startMark, endMark);
                }
                else {
                    window.performance.measure(name, startMark);
                }
                const entry = window.performance.getEntriesByName(name)[0];
                if (entry) {
                    console.log(`⚡ Performance: ${name} took ${entry.duration.toFixed(2)}ms`);
                }
            }
            catch (error) {
                console.warn(`Performance measurement failed for ${name}:`, error);
            }
        }
    },
    // Component render time tracking
    logRenderTime: (componentName, startTime) => {
        if (import.meta.env.DEV) {
            const duration = window.performance.now() - startTime;
            if (duration > 16) { // Only log if render takes more than 1 frame (16ms)
                console.log(`🐌 Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
            }
        }
    },
    // Bundle analysis helper
    logChunkLoad: (chunkName) => {
        if (import.meta.env.DEV && import.meta.env.VITE_PERFORMANCE_MONITORING === 'true') {
            console.log(`📦 Loaded chunk: ${chunkName}`);
        }
    }
};
// React DevTools Profiler helper
export const withProfiler = (Component, componentName) => {
    if (import.meta.env.DEV && import.meta.env.VITE_REACT_PROFILER_ENABLED === 'true') {
        const { Profiler } = React;
        const ProfiledComponent = (props) => {
            const onRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
                if (actualDuration > 16) { // Only log slow renders
                    console.log(`🔥 ${id} (${phase}): ${actualDuration.toFixed(2)}ms`);
                }
            };
            return (_jsx(Profiler, { id: componentName, onRender: onRenderCallback, children: _jsx(Component, { ...props }) }));
        };
        ProfiledComponent.displayName = `withProfiler(${componentName})`;
        return ProfiledComponent;
    }
    return Component;
};
