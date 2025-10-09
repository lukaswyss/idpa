'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Rating, RatingButton } from '@/components/ui/shadcn-io/rating'
import { useMemo, useState } from 'react'

type SimpleQuestion = {
  id: string
  label: string
  type: 'text' | 'boolean' | 'number' | 'select' | 'stars'
  items?: { id: string; label: string }[]
  stars?: number
}

export function QuestionListClient({ title, questions }: { title: string; questions: SimpleQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})

  const starCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const q of questions) {
      if (q.type === 'stars') map[q.id] = typeof q.stars === 'number' ? q.stars : 5
    }
    return map
  }, [questions])

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="font-medium">{title}</div>
        {questions.length === 0 ? (
          <div className="text-sm opacity-70">Keine Fragen konfiguriert</div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={`${q.id}-${idx}`} className="space-y-1">
                <div className="text-sm">
                  {q.label} <span className="opacity-60 text-xs">[{q.type}]</span>
                </div>
                {q.type === 'text' && (
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={String((answers[q.id] as any) ?? '')}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                )}
                {q.type === 'number' && (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full"
                    value={String((answers[q.id] as any) ?? '')}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.id]: e.target.value ? Number(e.target.value) : undefined }))
                    }
                  />
                )}
                {q.type === 'boolean' && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(answers[q.id])}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.checked }))}
                    />
                    <span>Ja</span>
                  </label>
                )}
                {q.type === 'select' && Array.isArray(q.items) && (
                  <Select
                    value={String((answers[q.id] as any) ?? '')}
                    onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {q.items.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {q.type === 'stars' && (
                  <div className="py-1">
                    <Rating
                      value={Number((answers[q.id] as any) || 0)}
                      onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                    >
                      {Array.from({ length: starCounts[q.id] ?? 5 }).map((_, i) => (
                        <RatingButton key={i} />
                      ))}
                    </Rating>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


