# -*- coding: utf-8 -*-
"""Kleine toonhoogtemeter (YIN) voor de bouwscripts.

Dezelfde aanpak gebruikt de app in de browser (js/voice.js), zodat de
lijn van de opname en de lijn van het kind vergelijkbaar zijn.
"""
import numpy as np


def yin_track(x, sr, fmin=70.0, fmax=500.0, frame=1024, hop=256, thresh=0.2):
    """Geeft (tijden, f0) terug; f0 = 0 waar geen stem is."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim > 1:
        x = x.mean(axis=1)
    tau_min = int(sr / fmax)
    tau_max = min(int(sr / fmin), frame - 1)
    times, f0s = [], []
    starts = list(range(0, len(x) - frame, hop))
    rms_frames = [np.sqrt(np.mean(x[s:s + frame] ** 2)) for s in starts]
    rms_max = max(rms_frames) if rms_frames else 1.0
    for start, rms in zip(starts, rms_frames):
        w = x[start:start + frame]
        t = (start + frame / 2) / sr
        if rms < 0.06 * rms_max:
            times.append(t); f0s.append(0.0); continue
        # verschilfunctie via autocorrelatie (FFT)
        nfft = 1 << int(np.ceil(np.log2(2 * frame)))
        W = np.fft.rfft(w, nfft)
        acf = np.fft.irfft(W * np.conj(W), nfft)[:tau_max + 1]
        sq = np.cumsum(w ** 2)
        taus = np.arange(tau_max + 1)
        e1 = sq[frame - 1 - taus]                      # som w[0 .. N-tau-1]^2
        e2 = sq[-1] - np.concatenate(([0.0], sq[:tau_max]))  # som w[tau .. N-1]^2
        d = e1 + e2 - 2 * acf
        d[0] = 0.0
        cmnd = np.ones_like(d)
        cs = np.cumsum(d[1:])
        cmnd[1:] = d[1:] * np.arange(1, tau_max + 1) / np.maximum(cs, 1e-12)
        tau = None
        for k in range(tau_min, tau_max):
            if cmnd[k] < thresh:
                while k + 1 < tau_max and cmnd[k + 1] < cmnd[k]:
                    k += 1
                tau = k
                break
        if tau is None:
            k = tau_min + int(np.argmin(cmnd[tau_min:tau_max]))
            if cmnd[k] < 0.4:
                tau = k
            else:
                times.append(t); f0s.append(0.0); continue
        # parabolische verfijning
        if 0 < tau < tau_max:
            a, b, c = cmnd[tau - 1], cmnd[tau], cmnd[tau + 1]
            den = a - 2 * b + c
            if abs(den) > 1e-12:
                tau = tau + 0.5 * (a - c) / den
        times.append(t); f0s.append(sr / tau)
    return np.array(times), np.array(f0s)


def contour(x, sr, n=32):
    """Toonlijn in halve tonen t.o.v. de mediaan, n punten, None waar stil."""
    t, f = yin_track(x, sr)
    voiced = f > 0
    if voiced.sum() < 3:
        return None
    # uitschieters (octaaffouten) weg
    st = np.full(len(f), np.nan)
    st[voiced] = 12 * np.log2(f[voiced] / np.median(f[voiced]))
    st[np.abs(st) > 9] = np.nan
    idx = np.where(~np.isnan(st))[0]
    if len(idx) < 3:
        return None
    a, b = idx[0], idx[-1]
    seg = st[a:b + 1]
    xs = np.linspace(0, len(seg) - 1, n)
    out = []
    for xi in xs:
        lo = int(np.floor(xi)); hi = min(lo + 1, len(seg) - 1)
        v = seg[lo] if np.isnan(seg[hi]) else (seg[hi] if np.isnan(seg[lo]) else seg[lo] + (seg[hi] - seg[lo]) * (xi - lo))
        out.append(None if np.isnan(v) else round(float(v), 1))
    return out


def median_f0(x, sr):
    t, f = yin_track(x, sr)
    v = f[f > 0]
    return float(np.median(v)) if len(v) else 0.0
