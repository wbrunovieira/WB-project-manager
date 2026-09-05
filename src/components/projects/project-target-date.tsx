"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

interface ProjectTargetDateProps {
  startDate?: Date | string | null;
  targetDate?: Date | string | null;
  /** Um projeto concluído ou cancelado não está "atrasado". */
  status: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Faixa de datas do projeto, com a proximidade do alvo codificada na cor.
 *
 * O app inteiro gira em torno de prazo (SLA, horas úteis), então a data-alvo é
 * sinal, não enfeite: vencida lê vermelho, próxima lê âmbar. O cálculo depende
 * de "hoje", então só acontece depois da montagem — no servidor a data seria
 * outra e o HTML não bateria.
 */
export function ProjectTargetDate({
  startDate,
  targetDate,
  status,
}: ProjectTargetDateProps) {
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => {
    setToday(Date.now());
  }, []);

  if (!startDate && !targetDate) return null;

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });

  const closed = status === "COMPLETED" || status === "CANCELED";
  let tone = "text-ink-muted";
  let note = "";

  if (today !== null && targetDate && !closed) {
    const days = Math.ceil((new Date(targetDate).getTime() - today) / DAY_MS);
    if (days < 0) {
      tone = "text-danger";
      note = `${Math.abs(days)}d late`;
    } else if (days <= 7) {
      tone = "text-warn";
      note = days === 0 ? "due today" : `${days}d left`;
    }
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs ${tone}`}>
      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
      {/* Placeholder estável até montar, para o HTML do servidor bater. */}
      <span className="tabular">
        {today === null
          ? " "
          : [startDate && fmt(startDate), targetDate && fmt(targetDate)]
              .filter(Boolean)
              .join(" → ")}
      </span>
      {note && <span className="font-medium">· {note}</span>}
    </div>
  );
}
