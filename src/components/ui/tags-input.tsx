"use client"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { X as RemoveIcon, Tag } from "lucide-react"
import * as React from "react"
import { forwardRef, useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type TagType = {
  value: string
  label: string
}

const DELIMITER = ","

export interface TagsInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  placeholder?: string
  tags: TagType[]
  setTags: React.Dispatch<React.SetStateAction<TagType[]>>
  enableAutocomplete?: boolean
  autocompleteOptions?: TagType[]
  maxTags?: number
  minTags?: number
  readOnly?: boolean
  disabled?: boolean
  onTagAdd?: (tag: string) => void
  onTagRemove?: (tag: string) => void
  allowDuplicates?: boolean
  validate?: (tag: string) => boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  addOnPaste?: boolean
}

const groupVariants = {
  default: "flex flex-wrap gap-2 rounded-md border border-input p-2.5 text-sm ring-offset-background",
  ghost: "flex flex-wrap gap-2",
}

const TagsInput = forwardRef<HTMLDivElement, TagsInputProps>(
  (
    {
      placeholder,
      tags,
      setTags,
      enableAutocomplete,
      autocompleteOptions,
      maxTags,
      minTags,
      readOnly,
      disabled,
      onTagAdd,
      onTagRemove,
      allowDuplicates,
      validate,
      className,
      style,
      children,
      addOnPaste,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState("")
    const [isFocused, setIsFocused] = useState(false)

    const addTag = useCallback(
      (tag: TagType) => {
        if (!allowDuplicates && tags.some((t) => t.value === tag.value)) {
          return
        }
        if (maxTags && tags.length >= maxTags) {
          return
        }
        if (validate && !validate(tag.value)) {
          return
        }

        setTags([...tags, tag])
        onTagAdd?.(tag.value)
        setInputValue("")
      },
      [allowDuplicates, maxTags, onTagAdd, setTags, tags, validate]
    )

    const removeTag = useCallback(
      (tagToRemove: TagType) => {
        setTags(tags.filter((tag) => tag.value !== tagToRemove.value))
        onTagRemove?.(tagToRemove.value)
      },
      [onTagRemove, setTags, tags]
    )

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    }, [])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === DELIMITER) {
          e.preventDefault()
          const newTagValue = inputValue.trim()
          if (newTagValue) {
            addTag({ value: newTagValue, label: newTagValue })
          }
        } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
          removeTag(tags[tags.length - 1])
        }
      },
      [addTag, inputValue, removeTag, tags]
    )

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (!addOnPaste) {
          return
        }
        e.preventDefault()
        const pasteData = e.clipboardData.getData("text")
        const pastedTags = pasteData.split(DELIMITER).filter((tag) => tag.trim() !== "")
        pastedTags.forEach((tag) => addTag({ value: tag, label: tag }))
      },
      [addTag, addOnPaste]
    )

    const filteredAutocompleteOptions = autocompleteOptions?.filter(
      (option) => !tags.some((tag) => tag.value === option.value)
    )

    const count = useCommandState((state) => state.filtered.count)

    return (
      <div ref={ref} className={cn(groupVariants["default"], className)} style={style}>
        {tags.map((tag) => (
          <Badge
            key={tag.value}
            variant="secondary"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            {tag.label}
            {!readOnly && (
              <button onClick={() => removeTag(tag)}>
                <RemoveIcon className="h-4 w-4" />
              </button>
            )}
          </Badge>
        ))}
        <Command {...props}>
          <CommandPrimitive.Input
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            disabled={disabled}
            readOnly={readOnly}
          />

          <CommandList className="absolute top-full z-10 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            {isFocused && enableAutocomplete && filteredAutocompleteOptions && (
              <CommandGroup>
                {filteredAutocompleteOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => addTag(option)}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Tag className="h-4 w-4" />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    )
  }
)

TagsInput.displayName = "TagsInput"

export { TagsInput }
