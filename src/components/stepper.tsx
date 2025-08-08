
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
    return <div className="flex-auto border-t-2 border-dashed border-gray-200 transition-colors duration-500 group-data-[completed=true]:border-primary" />
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number
  children: React.ReactNode
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(({ className, children, index, ...props }, ref) => {
  const { activeStep } = useStepper()
  const isCompleted = index !== undefined && index < activeStep
  const isActive = index === activeStep
  
  return (
    <div
      ref={ref}
      className={cn('flex flex-col items-center gap-1.5', className)}
      data-completed={isCompleted}
      data-active={isActive}
      {...props}
    >
        {React.Children.map(children, (child) => 
            React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { isCompleted, isActive }) : child
        )}
    </div>
  )
})
Step.displayName = 'Step'


interface StepLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  isCompleted?: boolean
  isActive?: boolean
  icon: React.ElementType
}

const StepLabel = React.forwardRef<HTMLDivElement, StepLabelProps>(({ className, children, isCompleted, isActive, icon: Icon, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex flex-col items-center text-center', className)} {...props}>
       <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 transition-all duration-500',
          (isActive || isCompleted) && 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-white shadow-lg',
          isCompleted && 'bg-gradient-to-br from-purple-500 to-indigo-500'
        )}
      >
        {isCompleted ? <Check className="w-7 h-7" /> : <Icon className="w-7 h-7" />}
      </div>
      <p className={cn(
          "text-sm text-muted-foreground mt-2 transition-colors duration-500",
          (isActive || isCompleted) && "text-foreground font-semibold"
      )}>
        {children}
      </p>
    </div>
  )
})
StepLabel.displayName = 'StepLabel'

const StepContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('mt-4', className)} {...props} />
})
StepContent.displayName = 'StepContent'


export { Stepper, Step, StepLabel, StepContent }
