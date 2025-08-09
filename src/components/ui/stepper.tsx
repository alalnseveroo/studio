
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const StepperContext = React.createContext<{ activeStep: number }>({ activeStep: 0 })

const useStepper = () => React.useContext(StepperContext)

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep: number
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, children, activeStep, ...props }, ref) => {
    const steps = React.Children.toArray(children)

    return (
      <StepperContext.Provider value={{ activeStep }}>
        <div
          ref={ref}
          className={cn('flex items-center justify-between w-full', className)}
          {...props}
        >
          {steps.map((child, index) => {
            const isLastStep = index === steps.length - 1
            return (
              <React.Fragment key={index}>
                {React.cloneElement(child as React.ReactElement, { index })}
                {!isLastStep && <StepConnector />}
              </React.Fragment>
            )
          })}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = 'Stepper'


const StepConnector: React.FC = () => {
    const { activeStep } = useStepper();
    const stepIndex = React.useContext(StepContext).index;

    const isCompleted = stepIndex < activeStep;
    
    return <div className={cn(
        "flex-auto border-t-2 border-dashed border-gray-200 transition-colors duration-500",
        isCompleted && "border-primary"
    )} />
}


const StepContext = React.createContext<{ index: number }>({ index: 0 });

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number
  children: React.ReactNode
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(({ className, children, index = 0, ...props }, ref) => {
  const { activeStep } = useStepper()
  const isCompleted = index < activeStep
  const isActive = index === activeStep
  
  return (
    <StepContext.Provider value={{ index }}>
        <div
            ref={ref}
            className={cn('flex items-center gap-4', className)}
            data-completed={isCompleted}
            data-active={isActive}
            {...props}
        >
            {React.Children.map(children, (child) => 
                React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { isCompleted, isActive }) : child
            )}
        </div>
    </StepContext.Provider>
  )
})
Step.displayName = 'Step'


interface StepLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  isCompleted?: boolean
  isActive?: boolean
  icon?: React.ElementType
}

const StepLabel = React.forwardRef<HTMLDivElement, StepLabelProps>(({ className, children, isCompleted, isActive, icon: Icon, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
       <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300',
          isActive ? 'bg-primary border-primary text-primary-foreground' :
          isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'
        )}
      >
        {isCompleted ? <Check className="w-6 h-6" /> : (Icon ? <Icon className="w-5 h-5"/> : '!')}
      </div>
       <div className={cn(
           "flex flex-col text-left transition-colors duration-300",
           (isActive || isCompleted) ? "text-foreground" : "text-muted-foreground"
       )}>
          <span className="text-sm font-medium">{children}</span>
       </div>
    </div>
  )
})
StepLabel.displayName = 'StepLabel'


export { Stepper, Step, StepLabel }

    