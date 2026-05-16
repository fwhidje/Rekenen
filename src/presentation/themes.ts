import type { ComponentType } from 'react'
import type { CounterProps } from './nature/Counters'
import type { SceneTokens } from './tokens'
import { NATURE_TOKENS, SPACE_TOKENS, FACTORY_TOKENS } from './tokens'
import { Bee, Butterfly, Ladybug, Mushroom, Leaf, Daisy } from './nature/Counters'
import { MeadowBackground, PondBackground } from './nature/Backgrounds'
import { SharedDefs as NatureDefs } from './nature/Defs'
import { Rocket, Saturn, Alien, Star, Earth, Astronaut } from './space/Counters'
import { StarfieldBackground, MoonscapeBackground } from './space/Backgrounds'
import { SharedDefs as SpaceDefs } from './space/Defs'
import { Gear, Robot, Crate, Lamp, Drum, Helm } from './factory/Counters'
import { FactoryInteriorBackground, FactoryExteriorBackground } from './factory/Backgrounds'
import { SharedDefs as FactoryDefs } from './factory/Defs'

export type { SceneTokens }

export interface ExerciseScene {
  Counter:     ComponentType<CounterProps>
  containerBg: string
  tokens:      SceneTokens
}

export interface ThemeBackground {
  Background:  ComponentType<{ children?: React.ReactNode; style?: React.CSSProperties }>
  containerBg: string
}

export interface Theme {
  id:          string
  SharedDefs:  ComponentType
  tokens:      SceneTokens
  counters:    ComponentType<CounterProps>[]
  backgrounds: ThemeBackground[]
}

export const NATURE_THEME: Theme = {
  id: 'nature',
  SharedDefs: NatureDefs,
  tokens: NATURE_TOKENS,
  counters: [Bee, Butterfly, Ladybug, Mushroom, Leaf, Daisy],
  backgrounds: [
    { Background: MeadowBackground, containerBg: 'rgba(255,255,255,0.55)' },
    { Background: PondBackground,   containerBg: 'rgba(255,255,255,0.55)' },
  ],
}

export const SPACE_THEME: Theme = {
  id: 'space',
  SharedDefs: SpaceDefs,
  tokens: SPACE_TOKENS,
  counters: [Rocket, Saturn, Alien, Star, Earth, Astronaut],
  backgrounds: [
    { Background: StarfieldBackground, containerBg: 'rgba(255,255,255,0.55)' },
    { Background: MoonscapeBackground, containerBg: 'rgba(255,255,255,0.55)' },
  ],
}

export const FACTORY_THEME: Theme = {
  id: 'factory',
  SharedDefs: FactoryDefs,
  tokens: FACTORY_TOKENS,
  counters: [Gear, Robot, Crate, Lamp, Drum, Helm],
  backgrounds: [
    { Background: FactoryInteriorBackground, containerBg: 'rgba(255,255,255,0.55)' },
    { Background: FactoryExteriorBackground, containerBg: 'rgba(255,255,255,0.55)' },
  ],
}

export const THEMES: Theme[] = [NATURE_THEME, SPACE_THEME, FACTORY_THEME]
