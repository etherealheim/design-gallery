"use client";

import React, { useEffect, useMemo, useState } from "react";

interface HourglassAnimationProps {
  width?: number; // must be odd number to keep hourglass symmetric
  height?: number; // must be even to split halves equally
  tickMs?: number; // interval in milliseconds
  characterSet?: "latin" | "katakana" | "mixed" | "custom";
  customChars?: string[]; // used when characterSet === "custom"
  neckWidth?: number; // odd number, visual neck width in characters
  rotateMs?: number; // rotation animation duration
}

const emptyChar = " ";

const LATIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
// Halfwidth Katakana keeps alignment in monospace fonts
const KATAKANA_HALF = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ･ｰ".split("");

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveCharset(kind: HourglassAnimationProps["characterSet"], custom?: string[]): string[] {
  if (kind === "latin") return LATIN_CHARS;
  if (kind === "katakana") return KATAKANA_HALF;
  if (kind === "custom" && custom && custom.length > 0) return custom;
  return [...LATIN_CHARS, ...KATAKANA_HALF];
}

function createInteriorMask(width: number, height: number, neckWidth: number): boolean[][] {
  const half = height / 2;
  const maxOffset = Math.floor((width - neckWidth) / 2);
  const mask: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  for (let row = 0; row < height; row++) {
    const t = row < half ? row : height - 1 - row; // distance from nearest end
    const offset = Math.floor(((half - 1 - t) / (half - 1)) * 0 + ((t) / (half - 1)) * maxOffset);
    const start = offset;
    const end = width - 1 - offset;
    for (let col = start; col <= end; col++) {
      mask[row][col] = true;
    }
  }
  return mask;
}

function HourglassAnimation({
  width = 21,
  height = 22,
  tickMs = 60,
  characterSet = "mixed",
  customChars,
  neckWidth = 1,
  rotateMs = 450,
}: HourglassAnimationProps) {
  // normalize dimensions
  if (width % 2 === 0) width += 1;
  if (height % 2 === 1) height += 1;
  if (neckWidth < 1) neckWidth = 1;
  if (neckWidth % 2 === 0) neckWidth += 1;

  const charset = useMemo(() => resolveCharset(characterSet, customChars), [characterSet, customChars]);
  const mask = useMemo(() => createInteriorMask(width, height, neckWidth), [width, height, neckWidth]);

  const [grid, setGrid] = useState<string[][]>(() => {
    // Deterministic initial render to avoid hydration mismatch; fill interior with spaces.
    return mask.map((rowMask) => rowMask.map((isInterior) => (isInterior ? emptyChar : emptyChar)));
  });

  const [initialized, setInitialized] = useState(false);

  // Initialize randomized sand after mount and when dependencies change
  useEffect(() => {
    setGrid(
      mask.map((rowMask, rowIdx) =>
        rowMask.map((isInterior) => (isInterior && rowIdx < height / 2 ? pickRandom(charset) : emptyChar))
      )
    );
    setInitialized(true);
  }, [mask, height, charset]);

  const step = React.useCallback(() => {
    if (!initialized) return;
    setGrid((prev) => {
      // Count sand in halves based on fixed orientation (top/bottom)
      const topCount = prev.slice(0, height / 2).reduce((acc, row, rIdx) => acc + row.reduce((a, cell, cIdx) => a + (cell !== emptyChar && mask[rIdx][cIdx] ? 1 : 0), 0), 0);
      const bottomCount = prev.slice(height / 2).reduce((acc, row, idx) => acc + row.reduce((a, cell, cIdx) => a + (cell !== emptyChar && mask[idx + height / 2][cIdx] ? 1 : 0), 0), 0);



      const next = prev.map((row) => [...row]);
      let moved = false;

      function canMoveTo(r: number, c: number): boolean {
        return r >= 0 && r < height && c >= 0 && c < width && mask[r][c] && prev[r][c] === emptyChar && next[r][c] === emptyChar;
      }

      // Gravity always downward in grid orientation
      for (let r = height - 2; r >= 0; r--) {
          const leftToRight = Math.random() < 0.5;
          if (leftToRight) {
            for (let c = 0; c < width; c++) {
              const here = prev[r][c];
              if (here === emptyChar || !mask[r][c]) continue;
              const isSource = r < height / 2;
              const tryDiagFirst = isSource && Math.random() < 0.6;
              const moves: Array<[number, number]> = [];
              const down: [number, number] = [r + 1, c];
              const dl: [number, number] = [r + 1, c - 1];
              const dr: [number, number] = [r + 1, c + 1];
              if (tryDiagFirst) moves.push(dl, dr, down); else moves.push(down, dl, dr);
              if (Math.random() < 0.5) { const t = moves[1]; moves[1] = moves[2]; moves[2] = t; }
              for (const [nr, nc] of moves) {
                if (canMoveTo(nr, nc)) {
                  next[r][c] = emptyChar;
                  next[nr][nc] = pickRandom(charset);
                  moved = true;
                  break;
                }
              }
            }
          } else {
            for (let c = width - 1; c >= 0; c--) {
              const here = prev[r][c];
              if (here === emptyChar || !mask[r][c]) continue;
              const isSource = r < height / 2;
              const tryDiagFirst = isSource && Math.random() < 0.6;
              const moves: Array<[number, number]> = [];
              const down: [number, number] = [r + 1, c];
              const dl: [number, number] = [r + 1, c - 1];
              const dr: [number, number] = [r + 1, c + 1];
              if (tryDiagFirst) moves.push(dr, dl, down); else moves.push(down, dr, dl);
              if (Math.random() < 0.5) { const t = moves[1]; moves[1] = moves[2]; moves[2] = t; }
              for (const [nr, nc] of moves) {
                if (canMoveTo(nr, nc)) {
                  next[r][c] = emptyChar;
                  next[nr][nc] = pickRandom(charset);
                  moved = true;
                  break;
                }
              }
            }
          }
        }



      return next;
    });
  }, [height, width, mask, charset, rotateMs, initialized]);

  const swapGrid = React.useCallback(() => {
    setGrid(prev => {
      const swapped = prev.map((row) => [...row]);
      for (let r = 0; r < height / 2; r++) {
        for (let c = 0; c < width; c++) {
          if (!mask[r][c]) continue;
          const rr = height - 1 - r;
          const tmp = swapped[r][c];
          swapped[r][c] = swapped[rr][c];
          swapped[rr][c] = tmp;
        }
      }
      return swapped;
    });
  }, [height, width, mask]);

  useEffect(() => {
    if (!initialized) return;
    const id = setInterval(step, tickMs);
    return () => clearInterval(id);
  }, [step, tickMs, initialized]);

  const rendered = grid
    .map((row, r) =>
      row
        .map((cell, c) => {
          if (!mask[r][c]) return emptyChar;
          return cell;
        })
        .join("")
    )
    .join("\n");

  return (
    <pre
      className="inline-block font-mono font-medium leading-none text-xs md:text-sm whitespace-pre text-center select-none cursor-pointer"
      onClick={swapGrid}
    >
      {rendered}
    </pre>
  );
}

export { HourglassAnimation };
