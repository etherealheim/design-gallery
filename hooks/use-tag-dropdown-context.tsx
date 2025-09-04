"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface TagDropdownState {
  isOpen: boolean
  imageId: string | null
}

interface TagDropdownContextType {
  openDropdown: (imageId: string) => void
  closeDropdown: () => void
  currentDropdown: TagDropdownState
}

const TagDropdownContext = createContext<TagDropdownContextType | undefined>(undefined)

export function TagDropdownProvider({ children }: { children: ReactNode }) {
  const [currentDropdown, setCurrentDropdown] = useState<TagDropdownState>({
    isOpen: false,
    imageId: null
  })

  const openDropdown = useCallback((imageId: string) => {
    setCurrentDropdown({
      isOpen: true,
      imageId
    })
  }, [])

  const closeDropdown = useCallback(() => {
    setCurrentDropdown({
      isOpen: false,
      imageId: null
    })
  }, [])

  return (
    <TagDropdownContext.Provider value={{
      openDropdown,
      closeDropdown,
      currentDropdown
    }}>
      {children}
    </TagDropdownContext.Provider>
  )
}

export function useTagDropdown() {
  const context = useContext(TagDropdownContext)
  if (!context) {
    throw new Error('useTagDropdown must be used within a TagDropdownProvider')
  }
  return context
}
