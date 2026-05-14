import type { ComponentType } from 'react'
import type { CounterProps } from './nature/Counters'
import { Bee, Butterfly, Ladybug, Mushroom, Leaf, Daisy } from './nature/Counters'
import { MeadowBackground, PondBackground } from './nature/Backgrounds'
import { SharedDefs } from './nature/Defs'

export interface ExerciseScene {
  Counter: ComponentType<CounterProps>
  containerBg: string
}

export interface ThemeBackground {
  Background: ComponentType<{ children?: React.ReactNode; style?: React.CSSProperties }>
  containerBg: string
}

export interface Theme {
  id: string
  SharedDefs: ComponentType
  counters: ComponentType<CounterProps>[]
  backgrounds: ThemeBackground[]
}

export const NATURE_THEME: Theme = {
  id: 'nature',
  SharedDefs,
  counters: [Bee, Butterfly, Ladybug, Mushroom, Leaf, Daisy],
  backgrounds: [
    { Background: MeadowBackground, containerBg: 'rgba(255,255,255,0.55)' },
    { Background: PondBackground,   containerBg: 'rgba(255,255,255,0.55)' },
  ],
}

export const THEMES: Theme[] = [NATURE_THEME]
