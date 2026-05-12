interface Props {
  n: number
  size?: number
}

export function HandSVG({ n, size = 120 }: Props) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}hands/hand-${n}.svg`}
      alt={`${n} vingers`}
      style={{ width: size, height: size * 0.75, objectFit: 'contain' }}
    />
  )
}
