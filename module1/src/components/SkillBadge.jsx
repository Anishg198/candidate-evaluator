import { Badge } from './ui/badge'

const variantMap = {
  matched: 'success',
  missing: 'destructive',
  neutral: 'secondary',
  preferred: 'info'
}

export default function SkillBadge({ skill, variant = 'neutral' }) {
  return <Badge variant={variantMap[variant] || 'secondary'}>{skill}</Badge>
}
