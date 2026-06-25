import React, { useEffect, useState } from "react";
import "./App.css";

type StatResult = {
  Catégorie: string;
  effectif_reel: number;
  moyenne: number;
  ecart_type: number;
  z_score: number;
  p_gt: number;
  p_lt: number;
  pval_gt: number;
  pval_lt: number;
};

function formatNum(value: number) {
  return Number(value).toFixed(3);
}

async function downloadTextFile(filename: string, content: string) {
  const blob = new Blob(["\ufeff" + content], {
    type: "text/csv;charset=utf-8",
  });

  const pickerOptions = {
    suggestedName: filename,
    types: [
      {
        description: "Fichier CSV",
        accept: {
          "text/csv": [".csv"],
        },
      },
    ],
  };

  if ("showSaveFilePicker" in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker(pickerOptions);
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error(error);
    }
  }
}

async function saveBlobFile(filename: string, blob: Blob) {
  const pickerOptions = {
    suggestedName: filename,
    types: [
      {
        description: "Fichier CSV",
        accept: {
          "text/csv": [".csv"],
        },
      },
    ],
  };

  if ("showSaveFilePicker" in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker(pickerOptions);
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error(error);
    }
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}

async function getApiErrorMessage(response: Response) {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch {
    // Réponse non JSON
  }

  return "Erreur API.";
}

const API_BASE_URL = "https://geoastro-stat-api-production.up.railway.app";

function storeAccessTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("access_token");

  if (!token) {
    return;
  }

  sessionStorage.setItem("geoastro_stat_access_token", token);

  params.delete("access_token");

  const cleanQuery = params.toString();
  const cleanUrl =
    window.location.pathname +
    (cleanQuery ? `?${cleanQuery}` : "") +
    window.location.hash;

  window.history.replaceState({}, document.title, cleanUrl);
}

function getAccessHeaders(): HeadersInit {
  const token = sessionStorage.getItem("geoastro_stat_access_token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function isTrialAllowedCohort(cohort: string | null, lang: Lang) {
  if (!cohort) return false;

  return lang === "fr"
    ? cohort === "Médaillés Fields"
    : cohort === "Fields medalists";
}

const categoryTranslations: Record<string, string> = {
  Soleil: "Sun",
  Lune: "Moon",
  Mercure: "Mercury",
  Vénus: "Venus",
  Mars: "Mars",
  Jupiter: "Jupiter",
  Saturne: "Saturn",
  Uranus: "Uranus",
  Neptune: "Neptune",
  Pluton: "Pluto",

  "Représentation extensive (R)": "Extensive Representation (R)",
  "Existence extensive (E)": "Extensive Existence (E)",
  "Transcendance extensive (T)": "Extensive Transcendence (T)",
  "représentation intensive (r)": "Intensive representation (r)",
  "existence intensive (e)": "Intensive existence (e)",
  "transcendance intensive (t)": "Intensive transcendence (t)",
  "Pouvoir extensif (P)": "Extensive power (P)",
  "pouvoir intensif (p)": "Intensive power (p)",

  Bélier: "Aries",
  Taureau: "Taurus",
  Gémeaux: "Gemini",
  Cancer: "Cancer",
  Lion: "Leo",
  Vierge: "Virgo",
  Balance: "Libra",
  Scorpion: "Scorpio",
  Sagittaire: "Sagittarius",
  Capricorne: "Capricorn",
  Verseau: "Aquarius",
  Poissons: "Pisces",

  Ascendant: "Ascendant",
  "Milieu-du-Ciel": "Midheaven",
  Descendant: "Descendant",
  "Fond-du-Ciel": "Imum Coeli",

  "[catégorie] types de réaction": "[category] reaction types",
  "[catégorie] mobilités": "[category] mobilities",
  "[catégorie] phases": "[category] phases",
  "Force d'excitation": "Excitation strength",
  "Force d'inhibition": "Inhibition strength",
  "Vitesse d'excitation": "Excitation speed",
  "Lenteur d'excitation": "Excitation slowness",
  "Vitesse d'inhibition": "Inhibition speed",
  "Lenteur d'inhibition": "Inhibition slowness",
  "Sens des Contraires": "Sense of Contrasts",
  "Sens des Dosages": "Sense of Dosage",
  "Sens des Ensembles": "Sense of Wholeness",

  "Maison I": "House I",
  "Maison II": "House II",
  "Maison III": "House III",
  "Maison IV": "House IV",
  "Maison V": "House V",
  "Maison VI": "House VI",
  "Maison VII": "House VII",
  "Maison VIII": "House VIII",
  "Maison IX": "House IX",
  "Maison X": "House X",
  "Maison XI": "House XI",
  "Maison XII": "House XII",

  "Quadrant oriental diurne": "Diurnal Eastern Quadrant",
  "Quadrant occidental diurne": "Diurnal Western Quadrant",
  "Quadrant occidental nocturne": "Nocturnal Western Quadrant",
  "Quadrant oriental nocturne": "Nocturnal Eastern Quadrant",

  "Hémisphère oriental": "Eastern Hemisphere",
  "Hémisphère occidental": "Western Hemisphere",
  "Hémisphère diurne": "Diurnal Hemisphere",
  "Hémisphère nocturne": "Nocturnal Hemisphere",

  "Conjonction": "Conjunction",
  "Opposition": "Opposition",
  "Carré": "Square",
  "Trigone": "Trine",
  "Sextile": "Sextile",

  "Quadrant FC-AS": "Quadrant IC-ASC",
  "Quadrant AS-MC": "Quadrant ASC-MC",
  "Quadrant MC-DS": "Quadrant MC-DSC",
  "Quadrant DS-FC": "Quadrant DSC-IC",
};

function translateCategory(label: string, lang: "fr" | "en") {
  if (lang === "fr") return label;
  return categoryTranslations[label] ?? label;
}

const BORDER = "#cfd6df";
const TAB_BG = "#f3f4f6";
const ACTIVE_TAB_BG = "#FAFAF7";

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  border: "1px solid #aeb7c2",
  backgroundColor: "#f3f4f6",
  cursor: "pointer",
  borderRadius: 6,
  fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  padding: 7,
  border: "1px solid #aeb7c2",
  backgroundColor: "white",
  fontSize: 13,
};

const compactInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "3px 7px",
  height: 25,
  boxSizing: "border-box",
};

type Lang = "fr" | "en";

type TooltipKey =
  | "tab_analysis"
  | "tab_cohorts"
  | "tab_hf"
  | "tab_histograms"
  | "tab_curves"
  | "select_file"
  | "run_analysis"
  | "export_results"
  | "include_kde"
  | "perm_1000"
  | "perm_10000"
  | "lang_fr"
  | "lang_en"
  | "hist_select_file"
  | "hist_generate"
  | "hist_export"
  | "hist_stats_hide"
  | "hist_stats_show"
  | "chart_population"
  | "chart_category"
  | "chart_custom_title"
  | "curve_select_file"
  | "curve_generate"
  | "curve_export"
  | "curve_mode_gauss"
  | "curve_mode_kde"
  | "curve_element"
  | "hf_browse_m"
  | "hf_browse_f"
  | "hf_generate"
  | "hf_summary"
  | "model_export_fr"
  | "model_export_en"
  | "export_selected_cohort"
  | "integrated_cohorts"
  | "quick_guide"
  | "col_category"
  | "col_sample_mean"
  | "col_distribution_mean"
  | "col_std"
  | "col_zscore"
  | "col_empirical_over"
  | "col_empirical_under"
  | "col_pvalue_over"
  | "col_pvalue_under";

const UI_TOOLTIPS: Record<Lang, Record<TooltipKey, string>> = {
  fr: {
    tab_analysis: "Importer une cohorte de naissance et lancer le calcul statistique.",
    tab_cohorts: "Consulter les modèles CSV et exporter les cohortes intégrées.",
    tab_hf: "Fusionner deux fichiers de résultats Hommes / Femmes.",
    tab_histograms: "Générer des histogrammes à partir des résultats statistiques.",
    tab_curves: "Afficher une courbe de Gauss ou une courbe KDE.",

    select_file: "Sélectionner un fichier CSV de naissance compatible avec l’analyse.",
    run_analysis: "Lancer le calcul statistique :\nfeatures réelles, permutations et agrégation par catégorie.",
    export_results: "Mode essai : l’export CSV est réservé à la version complète.",
    include_kde: "Mode essai : l’export KDE est réservé à la version complète.",

    perm_1000: "Effectuer 1 000 permutations :\nplus rapide, mais moins précis.",
    perm_10000: "Effectuer 10 000 permutations :\nplus long, mais plus précis.",
    lang_fr: "Choisir la langue de l’interface : français ou anglais.",
    lang_en: "Choisir la langue de l’interface : français ou anglais.",

    hist_select_file: "Charger un fichier de résultats statistiques exporté depuis l’onglet Analyse.",
    hist_generate: "Générer l’histogramme selon la population et la catégorie sélectionnées.",
    hist_export: "Exporter le graphique affiché au format PNG.",
    hist_stats_hide: "Afficher uniquement les pourcentages empiriques.",
    hist_stats_show: "Ajouter les z-scores et p-values sur le graphique.",
    chart_population: "Choisir une analyse globale ou une comparaison Hommes / Femmes.",
    chart_category: "Choisir la famille d’éléments à représenter : planètes, signes, RET, maisons, etc.",
    chart_custom_title: "Saisir un titre libre pour remplacer le titre automatique du graphique.",

    curve_select_file: "Charger un fichier de résultats ou un fichier KDE exporté depuis l’analyse.",
    curve_generate: "Générer la courbe pour l’élément sélectionné.",
    curve_export: "Exporter la courbe affichée au format PNG.",
    curve_mode_gauss: "Courbe théorique basée sur une distribution normale.",
    curve_mode_kde: "Courbe empirique construite à partir des permutations KDE.",
    curve_element: "Choisir l’élément astrologique à visualiser sur la courbe.",

    hf_browse_m: "Sélectionner le fichier de résultats du groupe Hommes.",
    hf_browse_f: "Sélectionner le fichier de résultats du groupe Femmes.",
    hf_generate: "Fusionner les deux fichiers pour produire un CSV comparatif H/F.",
    hf_summary: "Résumé automatique de la fusion : effectifs, cohérence des fichiers et statut de génération du CSV H/F.",

    model_export_fr: "Exporter le modèle CSV français.",
    model_export_en: "Exporter le modèle CSV anglais.",
    export_selected_cohort: "Exporter la cohorte intégrée actuellement sélectionnée.",
    quick_guide: "Ouvrir le guide rapide : préparation du CSV, lancement du calcul, export des résultats et comparaisons H/F.",

    col_category: "Libellé de l’entité analysée : planète, famille RET, signe, maison, aspect, etc.",
    col_sample_mean: "Moyenne observée dans l’échantillon réel.",
    col_distribution_mean: "Moyenne obtenue dans la distribution nulle issue des permutations.",
    col_std: "Dispersion de la distribution de permutation autour de sa moyenne.",
    col_zscore: "Écart entre la valeur réelle et la moyenne de permutation, exprimé en écarts-types.",
    col_empirical_over: "Part des permutations ayant une valeur supérieure ou égale à la valeur réelle.",
    col_empirical_under: "Part des permutations ayant une valeur inférieure ou égale à la valeur réelle.",
    col_pvalue_over: "Approximation analytique de la probabilité de survalorisation à partir du z-score.",
    col_pvalue_under: "Approximation analytique de la probabilité de sous-valorisation à partir du z-score.",
    integrated_cohorts: "Liste des cohortes intégrées disponibles. Sélectionnez une cohorte pour pouvoir l’exporter au format CSV.",
  },

  en: {
    tab_analysis: "Import a birth cohort and launch the statistical calculation.",
    tab_cohorts: "View CSV templates and export built-in cohorts.",
    tab_hf: "Merge two Male / Female result files.",
    tab_histograms: "Generate histograms from statistical results.",
    tab_curves: "Display a Gaussian or KDE curve.",

    select_file: "Select a birth CSV file compatible with the analysis.",
    run_analysis: "Launch the statistical calculation:\nreal features, permutations and aggregation by category.",
    export_results: "Trial mode: CSV export is reserved for the full version.",
    include_kde: "Trial mode: KDE export is reserved for the full version.",

    perm_1000: "Run 1,000 permutations:\nfaster, but less precise.",
    perm_10000: "Run 10,000 permutations:\nslower, but more precise.",
    lang_fr: "Choose the interface language: French or English.",
    lang_en: "Choose the interface language: French or English.",

    hist_select_file: "Load a statistical results file exported from the Analysis tab.",
    hist_generate: "Generate the histogram using the selected population and category.",
    hist_export: "Export the displayed chart as PNG.",
    hist_stats_hide: "Display empirical percentages only.",
    hist_stats_show: "Add z-scores and p-values to the chart.",
    chart_population: "Choose either an overall analysis or a Male / Female comparison.",
    chart_category: "Choose the family of elements to display: planets, signs, RET, houses, etc.",
    chart_custom_title: "Enter a custom title to replace the automatic chart title.",

    curve_select_file: "Load a results file or a KDE file exported from the analysis.",
    curve_generate: "Generate the curve for the selected element.",
    curve_export: "Export the displayed curve as PNG.",
    curve_mode_gauss: "Theoretical curve based on a normal distribution.",
    curve_mode_kde: "Empirical curve built from KDE permutation samples.",
    curve_element: "Choose the astrological element to display on the curve.",

    hf_browse_m: "Select the results file for the Male group.",
    hf_browse_f: "Select the results file for the Female group.",
    hf_generate: "Merge both files to produce a comparative M/F CSV.",
    hf_summary: "Automatic merge summary: sample sizes, file consistency and M/F CSV generation status.",

    model_export_fr: "Export the French CSV template.",
    model_export_en: "Export the English CSV template.",
    export_selected_cohort: "Export the currently selected built-in cohort.",
    quick_guide: "Open the quick guide: CSV preparation, statistical calculation, result export and M/F comparisons.",

    col_category: "Label of the analysed entity: planet, RET family, sign, house, aspect, etc.",
    col_sample_mean: "Mean observed in the real sample.",
    col_distribution_mean: "Mean obtained from the permutation-based null distribution.",
    col_std: "Dispersion of the permutation distribution around its mean.",
    col_zscore: "Distance between the real value and the permutation mean, expressed in standard deviations.",
    col_empirical_over: "Share of permutations with a value greater than or equal to the real value.",
    col_empirical_under: "Share of permutations with a value lower than or equal to the real value.",
    col_pvalue_over: "Analytical approximation of the over-valuation probability from the z-score.",
    col_pvalue_under: "Analytical approximation of the under-valuation probability from the z-score.",
    integrated_cohorts: "List of available built-in cohorts. Select one cohort to export it as a CSV file.",
  },
};

function HelpTooltip({
  lang,
  tooltipKey,
  children,
  position = "top",
  safeLeft = false,
  safeRight = false,
  fullWidth = false,
}: {
  lang: Lang;
  tooltipKey: TooltipKey;
  children: React.ReactNode;
  position?: "top" | "bottom" | "right";
  safeLeft?: boolean;
  safeRight?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <span
      className={`help-tooltip-wrap help-tooltip-${position}${
        safeLeft ? " help-tooltip-safe-left" : ""
      }${safeRight ? " help-tooltip-safe-right" : ""}`}
      style={{
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {children}
      <span className="help-tooltip-bubble">
        {UI_TOOLTIPS[lang][tooltipKey]}
      </span>
    </span>
  );
}

type CsvRow = Record<string, string>;

const histogramCategoryMap: Record<string, string[]> = {
  planetes: [
    "Soleil",
    "Lune",
    "Mercure",
    "Vénus",
    "Mars",
    "Jupiter",
    "Saturne",
    "Uranus",
    "Neptune",
    "Pluton",
  ],

  ret: [
    "Représentation extensive (R)",
    "Existence extensive (E)",
    "Transcendance extensive (T)",
    "représentation intensive (r)",
    "existence intensive (e)",
    "transcendance intensive (t)",
    "Pouvoir extensif (P)",
    "pouvoir intensif (p)",
  ],

  signes: [
    "Bélier",
    "Taureau",
    "Gémeaux",
    "Cancer",
    "Lion",
    "Vierge",
    "Balance",
    "Scorpion",
    "Sagittaire",
    "Capricorne",
    "Verseau",
    "Poissons",
  ],

  familles_zodiacales: [
    "[catégorie] types de réaction",
    "[catégorie] mobilités",
    "[catégorie] phases",
    "Force d'excitation",
    "Force d'inhibition",
    "Vitesse d'excitation",
    "Lenteur d'excitation",
    "Vitesse d'inhibition",
    "Lenteur d'inhibition",
    "Sens des Contraires",
    "Sens des Dosages",
    "Sens des Ensembles",
  ],

  angularites: [
    "Ascendant",
    "Milieu-du-Ciel",
    "Descendant",
    "Fond-du-Ciel",
  ],

  maisons: [
    "Maison I",
    "Maison II",
    "Maison III",
    "Maison IV",
    "Maison V",
    "Maison VI",
    "Maison VII",
    "Maison VIII",
    "Maison IX",
    "Maison X",
    "Maison XI",
    "Maison XII",
  ],

  quadrants: [
    "Quadrant oriental diurne",
    "Quadrant occidental diurne",
    "Quadrant occidental nocturne",
    "Quadrant oriental nocturne",
  ],

  hemispheres: [
    "Hémisphère oriental",
    "Hémisphère occidental",
    "Hémisphère diurne",
    "Hémisphère nocturne",
  ],

  aspects: [
    "Conjonction",
    "Opposition",
    "Carré",
    "Trigone",
    "Sextile",
  ],
};

function parseCsvText(text: string): CsvRow[] {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const separator =
    (lines[0].match(/;/g) ?? []).length >= (lines[0].match(/,/g) ?? []).length
      ? ";"
      : ",";

  const headers = lines[0].split(separator).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(separator).map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function detectHistogramCsvType(rows: CsvRow[]) {
  if (!rows.length) {
    return "invalid";
  }

  const headers = Object.keys(rows[0]);

  const hasCategory =
    headers.includes("Catégorie astrologique");

  const hasStats =
    headers.includes("Proba empirique (surval)") &&
    headers.includes("Z-score") &&
    headers.includes("P-value (surval)");

  const hasGroup =
    headers.includes("Groupe");

  if (!hasCategory || !hasStats) {
    return "invalid";
  }

  return hasGroup ? "hf" : "global";
}

function detectAnalysisCsvType(rows: CsvRow[]) {
  if (!rows.length) {
    return "invalid";
  }

  const headers = Object.keys(rows[0]);

  const hasFrenchBirthColumns =
    headers.includes("Nom") &&
    headers.includes("Jour") &&
    headers.includes("Mois") &&
    headers.includes("Année") &&
    headers.includes("HeureTU") &&
    headers.includes("MinuteTU") &&
    headers.includes("Latitude") &&
    headers.includes("Longitude");

  const hasEnglishBirthColumns =
    headers.includes("Name") &&
    headers.includes("Day") &&
    headers.includes("Month") &&
    headers.includes("Year") &&
    headers.includes("HourUT") &&
    headers.includes("MinuteUT") &&
    headers.includes("Latitude") &&
    headers.includes("Longitude");

  return hasFrenchBirthColumns || hasEnglishBirthColumns
    ? "valid"
    : "invalid";
}

function toNumber(value: string | number | undefined) {
  if (value === undefined || value === null) return NaN;
  return Number(String(value).replace(",", "."));
}

function histogramColor(value: number) {
  if (value < 5) return "#808080";
  if (value > 95) return "#d95f02";
  return "#4682b4";
}

function getHistogramCategoryTitle(category: string, lang: "fr" | "en") {
  const labels: Record<string, { fr: string; en: string }> = {
    planetes: {
      fr: "planètes",
      en: "planets",
    },
    ret: {
      fr: "familles RET",
      en: "RET families",
    },
    signes: {
      fr: "signes du zodiaque",
      en: "zodiac signs",
    },
    familles_zodiacales: {
      fr: "familles zodiacales",
      en: "zodiac families",
    },
    angularites: {
      fr: "zones d’angularité",
      en: "angular zones",
    },
    maisons: {
      fr: "maisons",
      en: "houses",
    },
    quadrants: {
      fr: "quadrants",
      en: "quadrants",
    },
    hemispheres: {
      fr: "hémisphères",
      en: "hemispheres",
    },
    aspects: {
      fr: "aspects",
      en: "aspects",
    },
  };

  return labels[category]?.[lang] ?? labels.planetes[lang];
}

function getHistogramDisplayLabel(
  label: string,
  category: string,
  lang: "fr" | "en"
) {
  if (category === "ret") {
    const retMap: Record<string, string> = {
      "Représentation extensive (R)": "R",
      "Existence extensive (E)": "E",
      "Transcendance extensive (T)": "T",
      "représentation intensive (r)": "r",
      "existence intensive (e)": "e",
      "transcendance intensive (t)": "t",
      "Pouvoir extensif (P)": "P",
      "pouvoir intensif (p)": "p",
    };

    return retMap[label] ?? label;
  }

  if (category === "familles_zodiacales") {
    const zodiacFamilyMap: Record<string, string> = {
      "Force d'excitation": "F+",
      "Force d'inhibition": "F-",
      "Vitesse d'excitation": "V+",
      "Lenteur d'excitation": "L+",
      "Vitesse d'inhibition": "V-",
      "Lenteur d'inhibition": "L-",
      "Sens des Contraires": "SC",
      "Sens des Dosages": "SD",
      "Sens des Ensembles": "SE",
    };

    return zodiacFamilyMap[label] ?? label;
  }

  if (category === "angularites") {
    if (lang === "en") {
      const angularMapEn: Record<string, string> = {
        Ascendant: "ASC",
        "Milieu-du-Ciel": "MC",
        Descendant: "DSC",
        "Fond-du-Ciel": "IC",
      };

      return angularMapEn[label] ?? label;
    }

    const angularMapFr: Record<string, string> = {
      Ascendant: "AS",
      "Milieu-du-Ciel": "MC",
      Descendant: "DS",
      "Fond-du-Ciel": "FC",
    };

    return angularMapFr[label] ?? label;
  }

  if (category === "quadrants" && lang === "en") {
    const quadrantMapEn: Record<string, string> = {
      "Quadrant oriental diurne": "Quadrant ASC-MC",
      "Quadrant occidental diurne": "Quadrant MC-DSC",
      "Quadrant occidental nocturne": "Quadrant DSC-IC",
      "Quadrant oriental nocturne": "Quadrant IC-ASC",
      "Quadrant AS-MC": "Quadrant ASC-MC",
      "Quadrant MC-DS": "Quadrant MC-DSC",
      "Quadrant DS-FC": "Quadrant DSC-IC",
      "Quadrant FC-AS": "Quadrant IC-ASC",
    };

    return quadrantMapEn[label] ?? label;
  }

  if (category === "quadrants") {
    const quadrantMap: Record<string, string> = {
      "Quadrant oriental diurne": "Quadrant AS-MC",
      "Quadrant occidental diurne": "Quadrant MC-DS",
      "Quadrant occidental nocturne": "Quadrant DS-FC",
      "Quadrant oriental nocturne": "Quadrant FC-AS",
    };

    return quadrantMap[label] ?? label;
  }

  if (category === "hemispheres") {
    const hemisphereMapFr: Record<string, string> = {
      "Hémisphère oriental": "Oriental",
      "Hémisphère occidental": "Occidental",
      "Hémisphère diurne": "Diurne",
      "Hémisphère nocturne": "Nocturne",
    };

    const hemisphereMapEn: Record<string, string> = {
      "Hémisphère oriental": "Eastern",
      "Hémisphère occidental": "Western",
      "Hémisphère diurne": "Diurnal",
      "Hémisphère nocturne": "Nocturnal",
    };

    return lang === "fr"
      ? hemisphereMapFr[label] ?? label
      : hemisphereMapEn[label] ?? label;
  }

  return translateCategory(label, lang);
}

async function readFileAsText(file: File) {
  return await file.text();
}

function estimateAnalysisDurationMs(rowCount: number, permutations: number) {
  const permFactor = permutations / 1000;
  const cohortFactor = Math.pow(rowCount, 1.28);

  const estimated =
    2200 + cohortFactor * 140 * permFactor;

  return Math.max(4500, Math.min(150000, estimated));
}

function buildHistogramSvg(
  rows: CsvRow[],
  category: string,
  lang: "fr" | "en",
  showStats: boolean,
  customTitle: string
) {
  const wanted = histogramCategoryMap[category] ?? histogramCategoryMap.planetes;

  const filtered = wanted
    .map((label) => {
      const row = rows.find((r) => r["Catégorie astrologique"] === label);
      if (!row) return null;

      const rawValue = toNumber(row["Proba empirique (surval)"]);
      const value = rawValue <= 1.5 ? rawValue * 100 : rawValue;

      return {
        label,
        value,
        z: toNumber(row["Z-score"]),
        p: toNumber(row["P-value (surval)"]),
      };
    })
    .filter(Boolean) as {
      label: string;
      value: number;
      z: number;
      p: number;
    }[];

  const width = 1200;
  const height = 650;
  const margin = { top: 48, right: 24, bottom: 48, left: 66 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const categoryTitle = getHistogramCategoryTitle(category, lang);

  const title =
    customTitle.trim() ||
    (lang === "fr"
      ? `Répartition des ${categoryTitle} – Global`
      : `Distribution of ${categoryTitle} – Overall`);

  const barGap = 22;
  const groupExtraGap =
    category === "familles_zodiacales" ? 28 : 0;

  const extraGapCount =
    category === "familles_zodiacales" ? 2 : 0;

  const rawBarW =
    (chartW -
      barGap * (filtered.length - 1) -
      groupExtraGap * extraGapCount) /
    filtered.length;

  const limitedBarCategories = [
    "angularites",
    "quadrants",
    "hemispheres",
    "aspects",
  ];

  const barW =
    limitedBarCategories.includes(category)
      ? Math.min(125, Math.max(28, rawBarW))
      : Math.max(28, rawBarW);

  const totalBarsW =
    barW * filtered.length +
    barGap * (filtered.length - 1) +
    groupExtraGap * extraGapCount;

  const centeredOffset =
    limitedBarCategories.includes(category)
      ? (chartW - totalBarsW) / 2
      : 0;

  const y = (v: number) => margin.top + chartH - (Math.max(0, Math.min(100, v)) / 100) * chartH;

  const gridLines = Array.from({ length: 11 }, (_, i) => i * 10);

  const bars = filtered.map((item, i) => {
    const extraGroupOffset =
      category === "familles_zodiacales"
        ? (i >= 2 ? groupExtraGap : 0) +
          (i >= 6 ? groupExtraGap : 0)
        : 0;

    const x =
      margin.left +
      18 +
      centeredOffset +
      i * (barW + barGap) +
      extraGroupOffset;
    const bgY = y(100);
    const bgH = chartH;
    const barY = y(item.value);
    const barH = margin.top + chartH - barY;
    const color = histogramColor(item.value);
    const label = getHistogramDisplayLabel(
      item.label,
      category,
      lang
    );
    const isVeryHigh = item.value >= 95;
    const isVeryLow = item.value <= 12;

    const valueLabelY = barY - 8;

    const valueLabelFill = color;

    const statsY =
      isVeryHigh
        ? barY + 34
        : isVeryLow
          ? Math.max(margin.top + 22, barY - 42)
          : barY + 28;

    const statsFill =
      isVeryLow ? "#111827" : "#111827";

    return `
      <rect x="${x}" y="${bgY}" width="${barW}" height="${bgH}" fill="${color}" opacity="0.20" stroke="#111827" stroke-width="1"/>
      <rect x="${x}" y="${barY}" width="${barW}" height="${barH}" fill="${color}" stroke="#111827" stroke-width="1"/>
      <line x1="${x + barW / 2}" y1="${margin.top - 6}" x2="${x + barW / 2}" y2="${margin.top + chartH}" stroke="#d0d0d0" stroke-width="1"/>
      <text x="${x + barW / 2}" y="${valueLabelY}" text-anchor="middle" font-size="14" font-weight="600" fill="${valueLabelFill}">
        ${item.value.toFixed(1)}%
      </text>
      ${
        showStats && Number.isFinite(item.z) && Number.isFinite(item.p)
          ? `
            <rect
              x="${x + barW / 2 - 28}"
              y="${statsY - 12}"
              width="56"
              height="31"
              rx="3"
              fill="#ffffff"
              opacity="0.55"
            />
            <text x="${x + barW / 2}" y="${statsY}" text-anchor="middle" font-size="10.5" font-weight="500" fill="${statsFill}">
              <tspan x="${x + barW / 2}" dy="0">Z = ${item.z >= 0 ? "+" : ""}${item.z.toFixed(2)}</tspan>
              <tspan x="${x + barW / 2}" dy="13">p = ${item.p.toFixed(3)}</tspan>
            </text>
          `
          : ""
      }
      <text x="${x + barW / 2}" y="${margin.top + chartH + 24}" text-anchor="middle" font-size="14" font-weight="600" fill="#111827">
        ${label}
      </text>
    `;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: Segoe UI, Arial, sans-serif;">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="${width / 2}" y="30" text-anchor="middle" font-size="22" font-weight="700" fill="#111827">
        ${title}
      </text>

      ${gridLines.map((v) => `
        <line x1="${margin.left}" y1="${y(v)}" x2="${margin.left + chartW}" y2="${y(v)}"
          stroke="${v % 20 === 0 ? "#cccccc" : "#e0e0e0"}"
          stroke-width="1"
          stroke-dasharray="${v % 20 === 0 ? "0" : "4 3"}"/>
        ${v % 20 === 0 ? `<text x="${margin.left - 14}" y="${y(v) + 5}" text-anchor="end" font-size="14" font-weight="600" fill="#111827">${v}</text>` : ""}
      `).join("")}

      <line x1="${margin.left}" y1="${margin.top - 8}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.5"/>
      <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW + 24}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.5"/>
      <text x="25" y="${margin.top + chartH / 2}" transform="rotate(-90 25 ${margin.top + chartH / 2})" text-anchor="middle" font-size="16" font-weight="600" fill="#111827">%</text>

      ${bars}

      ${gridLines.map((v) => `
        <line x1="${margin.left}" y1="${y(v)}" x2="${margin.left + chartW}" y2="${y(v)}"
          stroke="${v % 20 === 0 ? "#b8b8b8" : "#d8d8d8"}"
          stroke-width="1"
          stroke-opacity="0.55"
          stroke-dasharray="${v % 20 === 0 ? "0" : "4 3"}"/>
      `).join("")}
    </svg>
  `;
}

function buildHistogramSvgHF(
  rows: CsvRow[],
  category: string,
  lang: "fr" | "en",
  showStats: boolean,
  customTitle: string
) {
  const wanted =
    histogramCategoryMap[category] ??
    histogramCategoryMap.planetes;

  const filtered = wanted
    .map((label) => {
      const menRow = rows.find(
        (r) =>
          r["Catégorie astrologique"] === label &&
          r["Groupe"] === "Hommes"
      );

      const womenRow = rows.find(
        (r) =>
          r["Catégorie astrologique"] === label &&
          r["Groupe"] === "Femmes"
      );

      if (!menRow || !womenRow) return null;

      const menValueRaw =
        toNumber(menRow["Proba empirique (surval)"]);

      const womenValueRaw =
        toNumber(womenRow["Proba empirique (surval)"]);

      return {
        label,
        men: {
          value: menValueRaw <= 1.5 ? menValueRaw * 100 : menValueRaw,
          z: toNumber(menRow["Z-score"]),
          p: toNumber(menRow["P-value (surval)"]),
        },
        women: {
          value: womenValueRaw <= 1.5 ? womenValueRaw * 100 : womenValueRaw,
          z: toNumber(womenRow["Z-score"]),
          p: toNumber(womenRow["P-value (surval)"]),
        },
      };
    })
    .filter(Boolean) as any[];

  const width = 1500;
  const height = 700;
  const margin = { top: 62, right: 34, bottom: 58, left: 78 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const categoryTitle = getHistogramCategoryTitle(category, lang);

  const title =
    customTitle.trim() ||
    (lang === "fr"
      ? `Répartition H/F des ${categoryTitle}`
      : `Male/Female distribution of ${categoryTitle}`);

  const pairGap = 0;

  const normalizedCategory = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("’", "'");

  const wideCategories = [
    "planetes",
    "signes",
    "maisons",
    "ret",
    "familles_zodiacales",
  ];

  const isWideHF = wideCategories.some((c) =>
    normalizedCategory.includes(c)
  );

  const isCompactHF = !isWideHF && filtered.length <= 9;

  const baseGroupGap = isCompactHF
    ? filtered.length <= 5
      ? 70
      : 38
    : 26;

  const extraGapAfter = (index: number) => {
    if (category === "familles_zodiacales") {
      return index === 1 || index === 5 ? 20 : 0;
    }

    return 0;
  };

  const totalExtraGaps = filtered.reduce(
    (sum, _item, index) => sum + extraGapAfter(index),
    0
  );

  const normalSlotW =
    (chartW - baseGroupGap * (filtered.length - 1) - totalExtraGaps) /
    filtered.length;

  const mildlyWiderHFCategories = [
    "ret",
  ];

  const stronglyWiderHFCategories = [
    "angularites",
    "quadrants",
    "hemispheres",
    "aspects",
  ];

  const singleBarW =
    mildlyWiderHFCategories.includes(category)
      ? Math.min(52, normalSlotW / 1.75)
      : stronglyWiderHFCategories.includes(category)
        ? 58
        : isCompactHF
          ? 42
          : Math.min(46, normalSlotW / 2.05);

  const pairW = singleBarW * 2 + pairGap;

  const totalCompactW =
    filtered.length * pairW +
    (filtered.length - 1) * baseGroupGap +
    filtered.reduce((sum, _item, index) => sum + extraGapAfter(index), 0);

  const startX = isCompactHF
    ? margin.left + (chartW - totalCompactW) / 2
    : margin.left + 18;

  const y = (v: number) =>
    margin.top +
    chartH -
    (Math.max(0, Math.min(100, v)) / 100) *
      chartH;

  const gridLines = Array.from({ length: 11 }, (_, i) => i * 10);

  const patternDefs = `
    <defs>
      <pattern
        id="femaleHatch"
        patternUnits="userSpaceOnUse"
        width="8"
        height="8"
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="8"
          stroke="#111827"
          stroke-width="1.4"
          opacity="0.85"
        />
      </pattern>
    </defs>
  `;

  const bars = filtered
    .map((item, i) => {
      const previousExtraGaps = filtered
        .slice(0, i)
        .reduce((sum, _item, index) => sum + extraGapAfter(index), 0);

      const baseX = isCompactHF
        ? startX + i * (pairW + baseGroupGap) + previousExtraGaps
        : startX + i * (normalSlotW + baseGroupGap) + previousExtraGaps;

      const menX = baseX;
      const womenX = baseX + singleBarW + pairGap;

      const menY = y(item.men.value);
      const womenY = y(item.women.value);

      const menH = margin.top + chartH - menY;
      const womenH = margin.top + chartH - womenY;

      const menColor = histogramColor(item.men.value);
      const womenColor = histogramColor(item.women.value);

      const label = getHistogramDisplayLabel(
        item.label,
        category,
        lang
      );

      const centerX = baseX + singleBarW;

      const menStatsY =
        item.men.value >= 95
          ? menY + 34
          : item.men.value <= 12
            ? Math.max(margin.top + 22, menY - 42)
            : menY + 28;

      const womenStatsY =
        item.women.value >= 95
          ? womenY + 34
          : item.women.value <= 12
            ? Math.max(margin.top + 22, womenY - 42)
            : womenY + 28;

      return `
        <rect
          x="${menX}"
          y="${y(100)}"
          width="${singleBarW}"
          height="${chartH}"
          fill="${menColor}"
          opacity="0.20"
          stroke="#111827"
          stroke-width="1"
        />

        <rect
          x="${womenX}"
          y="${y(100)}"
          width="${singleBarW}"
          height="${chartH}"
          fill="${womenColor}"
          opacity="0.20"
          stroke="#111827"
          stroke-width="1"
        />

        <rect
          x="${menX}"
          y="${menY}"
          width="${singleBarW}"
          height="${menH}"
          fill="${menColor}"
          stroke="#111827"
          stroke-width="1"
        />

        <rect
          x="${womenX}"
          y="${womenY}"
          width="${singleBarW}"
          height="${womenH}"
          fill="${womenColor}"
          stroke="#111827"
          stroke-width="1"
        />

        <rect
          x="${womenX}"
          y="${womenY}"
          width="${singleBarW}"
          height="${womenH}"
          fill="url(#femaleHatch)"
          stroke="none"
        />

        <line
          x1="${menX + singleBarW / 2}"
          y1="${margin.top - 6}"
          x2="${menX + singleBarW / 2}"
          y2="${margin.top + chartH}"
          stroke="#d0d0d0"
          stroke-width="1"
        />

        <line
          x1="${womenX + singleBarW / 2}"
          y1="${margin.top - 6}"
          x2="${womenX + singleBarW / 2}"
          y2="${margin.top + chartH}"
          stroke="#d0d0d0"
          stroke-width="1"
        />

        <text
          x="${menX + singleBarW / 2}"
          y="${menY - 8}"
          text-anchor="middle"
          font-size="14"
          font-weight="600"
          fill="${menColor}"
        >
          ${item.men.value.toFixed(1)}%
        </text>

        <text
          x="${womenX + singleBarW / 2}"
          y="${womenY - 8}"
          text-anchor="middle"
          font-size="14"
          font-weight="600"
          fill="${womenColor}"
        >
          ${item.women.value.toFixed(1)}%
        </text>

        ${
          showStats
            ? `
              <rect
                x="${menX + singleBarW / 2 - 23}"
                y="${menStatsY - 12}"
                width="46"
                height="31"
                rx="3"
                fill="#ffffff"
                opacity="0.72"
              />
              <text
                x="${menX + singleBarW / 2}"
                y="${menStatsY}"
                text-anchor="middle"
                font-size="10.5"
                font-weight="500"
                fill="#111827"
              >
                <tspan x="${menX + singleBarW / 2}" dy="0">Z = ${item.men.z >= 0 ? "+" : ""}${item.men.z.toFixed(2)}</tspan>
                <tspan x="${menX + singleBarW / 2}" dy="13">p = ${item.men.p.toFixed(3)}</tspan>
              </text>

              <rect
                x="${womenX + singleBarW / 2 - 23}"
                y="${womenStatsY - 12}"
                width="46"
                height="31"
                rx="3"
                fill="#ffffff"
                opacity="0.72"
              />
              <text
                x="${womenX + singleBarW / 2}"
                y="${womenStatsY}"
                text-anchor="middle"
                font-size="10.5"
                font-weight="500"
                fill="#111827"
              >
                <tspan x="${womenX + singleBarW / 2}" dy="0">Z = ${item.women.z >= 0 ? "+" : ""}${item.women.z.toFixed(2)}</tspan>
                <tspan x="${womenX + singleBarW / 2}" dy="13">p = ${item.women.p.toFixed(3)}</tspan>
              </text>
            `
            : ""
        }

        <text
          x="${centerX}"
          y="${margin.top + chartH + 28}"
          text-anchor="middle"
          font-size="14"
          font-weight="600"
          fill="#111827"
        >
          ${label}
        </text>
      `;
    })
    .join("");

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      style="font-family: Segoe UI, Arial, sans-serif;"
    >
      ${patternDefs}

      <rect width="100%" height="100%" fill="#ffffff"/>

      <text
        x="${width / 2}"
        y="32"
        text-anchor="middle"
        font-size="22"
        font-weight="700"
        fill="#111827"
      >
        ${title}
      </text>

      <g transform="translate(${margin.left + 14}, ${margin.top - 48})">
        <rect x="0" y="0" width="28" height="12" fill="white" stroke="#111827" stroke-width="1"/>
        <text x="38" y="11" font-size="13" font-weight="600" fill="#111827">
          ${lang === "fr" ? "Hommes (barres pleines)" : "Male (plain bars)"}
        </text>

        <rect x="0" y="20" width="28" height="12" fill="white" stroke="#111827" stroke-width="1"/>
        <rect x="0" y="20" width="28" height="12" fill="url(#femaleHatch)"/>
        <text x="38" y="31" font-size="13" font-weight="600" fill="#111827">
          ${lang === "fr" ? "Femmes (barres hachurées)" : "Female (hatched bars)"}
        </text>
      </g>

      ${gridLines
        .map(
          (v) => `
            <line
              x1="${margin.left}"
              y1="${y(v)}"
              x2="${margin.left + chartW}"
              y2="${y(v)}"
              stroke="${v % 20 === 0 ? "#cccccc" : "#e0e0e0"}"
              stroke-width="1"
              stroke-dasharray="${v % 20 === 0 ? "0" : "4 3"}"
            />
            ${
              v % 20 === 0
                ? `<text x="${margin.left - 14}" y="${y(v) + 5}" text-anchor="end" font-size="14" font-weight="600" fill="#111827">${v}</text>`
                : ""
            }
          `
        )
        .join("")}

      <line
        x1="${margin.left}"
        y1="${margin.top - 8}"
        x2="${margin.left}"
        y2="${margin.top + chartH}"
        stroke="#111827"
        stroke-width="1.5"
      />

      <line
        x1="${margin.left}"
        y1="${margin.top + chartH}"
        x2="${margin.left + chartW + 24}"
        y2="${margin.top + chartH}"
        stroke="#111827"
        stroke-width="1.5"
      />

      <text
        x="28"
        y="${margin.top + chartH / 2}"
        transform="rotate(-90 28 ${margin.top + chartH / 2})"
        text-anchor="middle"
        font-size="16"
        font-weight="600"
        fill="#111827"
      >
        %
      </text>

      ${bars}

      ${gridLines
        .map(
          (v) => `
            <line
              x1="${margin.left}"
              y1="${y(v)}"
              x2="${margin.left + chartW}"
              y2="${y(v)}"
              stroke="${v % 20 === 0 ? "#b8b8b8" : "#d8d8d8"}"
              stroke-width="1"
              stroke-opacity="0.55"
              stroke-dasharray="${v % 20 === 0 ? "0" : "4 3"}"
            />
          `
        )
        .join("")}
    </svg>
  `;
}

function erfApprox(x: number) {
  const sign = x >= 0 ? 1 : -1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y =
    1 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-absX * absX);

  return sign * y;
}

function normalCdf(x: number) {
  return 0.5 * (1 + erfApprox(x / Math.sqrt(2)));
}

function getCurveValue(row: CsvRow) {
  const candidates = [
    "Pourcentage",
    "Proba empirique (surval)",
    "Proba empirique (surv)",
    "p_gt",
    "pval_gt",
    "effectif_rel",
    "sample_mean",
    "effectif_reel",
  ];

  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== "") {
      const n = toNumber(row[key]);
      if (Number.isFinite(n)) {
        return n <= 1.5 ? n * 100 : n;
      }
    }
  }

  return NaN;
}

function getKdeObservedValue(row: CsvRow) {
  const n = toNumber(
    row["effectif_reel"] ??
    row["sample_mean"] ??
    row["Pourcentage"]
  );

  return Number.isFinite(n) ? n : NaN;
}

function getCurveZ(row: CsvRow, value: number) {
  const raw =
    row["Z-score"] ??
    row["z_score"] ??
    row["Z"] ??
    "";

  const z = toNumber(raw);

  if (Number.isFinite(z)) {
    return z;
  }

  return (value - 50) / 20;
}

function getCurveP(row: CsvRow, z: number) {
  const raw =
    row["P-value"] ??
    row["P-value (surval)"] ??
    row["pval_gt"] ??
    row["p_gt"] ??
    "";

  const p = toNumber(raw);

  if (Number.isFinite(p)) {
    return p;
  }

  return 2 * (1 - normalCdf(Math.abs(z)));
}

function getCurveRowLabel(row: CsvRow) {
  return (
    row["Catégorie astrologique"] ??
    row["Élément"] ??
    row["Element"] ??
    row["Catégorie"] ??
    row["Category"] ??
    ""
  ).trim();
}

function getCurveTitle(category: string, population: string, lang: "fr" | "en") {
  const categoryTitle = getHistogramCategoryTitle(category, lang);

  if (lang === "fr") {
    return `Courbe de distribution des ${categoryTitle} (${population === "hf" ? "Hommes-Femmes" : "global"})`;
  }

  return `Distribution curve of ${categoryTitle} (${population === "hf" ? "M/F" : "overall"})`;
}

function normalizeCurveLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
}

function findCurveRow(rows: CsvRow[], label: string) {
  const wanted = normalizeCurveLabel(label);

  return rows.find((row) => {
    const current = normalizeCurveLabel(getCurveRowLabel(row));
    return current === wanted;
  });
}

function getCurveGroupItems(category: string, element: string) {
  if (category !== "familles_zodiacales") {
    return [element];
  }

  const groups: Record<string, string[]> = {
    "[catégorie] types de réaction": [
      "Force d'excitation",
      "Force d'inhibition",
    ],
    "[catégorie] mobilités": [
      "Vitesse d'excitation",
      "Lenteur d'excitation",
      "Vitesse d'inhibition",
      "Lenteur d'inhibition",
    ],
    "[catégorie] phases": [
      "Sens des Contraires",
      "Sens des Dosages",
      "Sens des Ensembles",
    ],
  };

  return groups[element] ?? [element];
}

function getCurveMarkerColor(item: string, grouped: boolean) {
  if (!grouped) {
    return "blue";
  }

  const colors: Record<string, string> = {
    "Force d'excitation": "red",
    "Force d'inhibition": "blue",
    "Vitesse d'excitation": "red",
    "Lenteur d'excitation": "orange",
    "Vitesse d'inhibition": "green",
    "Lenteur d'inhibition": "blue",
    "Sens des Contraires": "orange",
    "Sens des Dosages": "green",
    "Sens des Ensembles": "blue",
  };

  return colors[item] ?? "blue";
}

function getKdePermutationColumns(row: CsvRow) {
  return Object.keys(row).filter((key) => /^\d+$/.test(key.trim()));
}

function getKdeValues(row: CsvRow) {
  return getKdePermutationColumns(row)
    .map((key) => toNumber(row[key]))
    .filter((value) => Number.isFinite(value));
}

function findKdeRow(rows: CsvRow[], label: string) {
  const wanted = normalizeCurveLabel(label);
  const wantedTranslated = normalizeCurveLabel(translateCategory(label, "en"));

  return rows.find((row) => {
    const current = normalizeCurveLabel(
      row["Categorie"] ??
        row["Catégorie"] ??
        row["Category"] ??
        getCurveRowLabel(row)
    );

    return current === wanted || current === wantedTranslated;
  });
}

function detectCurveCsvType(rows: CsvRow[]) {
  if (!rows.length) return "invalid";

  const headers = Object.keys(rows[0]);
  const hasKdeColumns = headers.some((key) => /^\d+$/.test(key.trim()));

  if (hasKdeColumns) return "kde";

  return detectHistogramCsvType(rows);
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function std(values: number[]) {
  if (values.length < 2) return 0;

  const m = mean(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - m, 2), 0) /
    (values.length - 1);

  return Math.sqrt(variance);
}

function kdeBandwidth(values: number[]) {
  const s = std(values);

  if (!Number.isFinite(s) || s <= 0) {
    return 1;
  }

  return 1.06 * s * Math.pow(values.length, -1 / 5);
}

function kdeDensityAt(x: number, values: number[], bandwidth: number) {
  const coeff = 1 / (values.length * bandwidth * Math.sqrt(2 * Math.PI));

  return (
    coeff *
    values.reduce((sum, value) => {
      const u = (x - value) / bandwidth;
      return sum + Math.exp(-0.5 * u * u);
    }, 0)
  );
}

function buildGaussCurveSvg(
  rows: CsvRow[],
  category: string,
  element: string,
  population: string,
  lang: "fr" | "en",
  customTitle: string
) {
  const selectedItems = getCurveGroupItems(category, element);
  const grouped = selectedItems.length > 1;

  const markerData = selectedItems
    .map((item) => {
      const row = findCurveRow(rows, item);
      if (!row) return null;

      const value = getCurveValue(row);
      if (!Number.isFinite(value)) return null;

      const z = getCurveZ(row, value);
      const p = getCurveP(row, z);

      return {
        item,
        value,
        z,
        p,
        color: getCurveMarkerColor(item, grouped),
      };
    })
    .filter(Boolean) as {
      item: string;
      value: number;
      z: number;
      p: number;
      color: string;
    }[];

  if (!markerData.length) {
    return "";
  }

  const width = 1500;
  const height = 650;
  const margin = { top: 72, right: 24, bottom: 62, left: 72 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const title =
    customTitle.trim() ||
    getCurveTitle(category, population, lang);

  const xScale = (x: number) =>
    margin.left + (Math.max(0, Math.min(100, x)) / 100) * chartW;

  const gauss = (x: number) => {
    const mu = 50;
    const sigma = 20;
    return (
      (1 / (sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2))
    );
  };

  const maxY = gauss(50) * 1.25;

  const yScale = (y: number) =>
    margin.top + chartH - (y / maxY) * chartH;

  const points = Array.from({ length: 401 }, (_, i) => {
    const x = (i / 400) * 100;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const leftArea = Array.from({ length: 41 }, (_, i) => {
    const x = (i / 40) * 5;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const centerArea = Array.from({ length: 361 }, (_, i) => {
    const x = 5 + (i / 360) * 90;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const rightArea = Array.from({ length: 41 }, (_, i) => {
    const x = 95 + (i / 40) * 5;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const orderedMarkers = [...markerData].sort((a, b) => a.value - b.value);
  const rankMap = new Map(
    orderedMarkers.map((marker, index) => [marker.item, index])
  );

  const markers = markerData
    .map((marker) => {
      const lineX = xScale(marker.value);
      const valueClamped = Math.max(0.1, Math.min(99.9, marker.value));
      const rank = rankMap.get(marker.item) ?? 0;

      const textAnchor =
        valueClamped >= 92
          ? "end"
          : valueClamped <= 8
            ? "start"
            : rank === 0
              ? "end"
              : "start";

      const textX =
        valueClamped >= 92
          ? lineX - 26
          : valueClamped <= 8
            ? lineX + 26
            : rank === 0
              ? lineX - 18
              : lineX + 18;

      const yFractions =
        orderedMarkers.length === 4
          ? [0.22, 0.42, 0.62, 0.82]
          : orderedMarkers.length === 3
            ? [0.28, 0.52, 0.76]
            : orderedMarkers.length === 2
              ? [0.35, 0.68]
              : [0.78];

      const textY =
        margin.top +
        chartH -
        chartH * (yFractions[Math.min(rank, yFractions.length - 1)] ?? 0.75);

      const label = getHistogramDisplayLabel(
        marker.item,
        category,
        lang
      );

      return `
        <line x1="${lineX}" y1="${margin.top}" x2="${lineX}" y2="${margin.top + chartH}" stroke="${marker.color}" stroke-width="1.6"/>

        <text x="${textX}" y="${textY}" text-anchor="${textAnchor}" font-size="12" font-weight="600" fill="${marker.color}">
          <tspan x="${textX}" dy="0" font-size="14" font-weight="700">${label}</tspan>
          <tspan x="${textX}" dy="14">μ = ${marker.value.toFixed(1)}%</tspan>
          <tspan x="${textX}" dy="14">Z=${marker.z >= 0 ? "+" : ""}${marker.z.toFixed(2)}</tspan>
          <tspan x="${textX}" dy="14">P=${marker.p.toFixed(3)}</tspan>
        </text>
      `;
    })
    .join("");

  const xTicks = Array.from({ length: 11 }, (_, i) => i * 10);
  const yTicks = Array.from({ length: 5 }, (_, i) => i * 0.005);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: Segoe UI, Arial, sans-serif;">
      <rect width="100%" height="100%" fill="#ffffff"/>

      <text x="${width / 2}" y="35" text-anchor="middle" font-size="20" font-weight="500" fill="#111827">
        ${title}
      </text>

      <polygon points="${xScale(0)},${yScale(0)} ${leftArea} ${xScale(5)},${yScale(0)}" fill="#eeeeee" opacity="0.5"/>
      <polygon points="${xScale(5)},${yScale(0)} ${centerArea} ${xScale(95)},${yScale(0)}" fill="#d0e6ff" opacity="0.42"/>
      <polygon points="${xScale(95)},${yScale(0)} ${rightArea} ${xScale(100)},${yScale(0)}" fill="#ffb347" opacity="0.65"/>

      <polyline points="${points}" fill="none" stroke="#708090" stroke-width="2.2"/>

      ${xTicks.map((x) => `
        <line x1="${xScale(x)}" y1="${margin.top}" x2="${xScale(x)}" y2="${margin.top + chartH}" stroke="#b8b8b8" stroke-width="1" stroke-dasharray="2 3" opacity="0.55"/>
        <text x="${xScale(x)}" y="${margin.top + chartH + 24}" text-anchor="middle" font-size="14" font-weight="500" fill="#111827">${x}</text>
      `).join("")}

      ${yTicks.map((y) => `
        <text x="${margin.left - 14}" y="${yScale(y) + 5}" text-anchor="end" font-size="14" font-weight="500" fill="#111827">${y.toFixed(3)}</text>
      `).join("")}

      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left + chartW}" y2="${margin.top}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left + chartW}" y1="${margin.top}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>

      ${markers}

      <g transform="translate(${margin.left + 6}, ${margin.top + 19})">
        <rect x="-2" y="-15" width="245" height="30" rx="5" ry="5" fill="white" opacity="0.94" stroke="#b8c0cc" stroke-width="1.35"/>
        <line x1="4" y1="0" x2="28" y2="0" stroke="#708090" stroke-width="2.2"/>
        <text x="36" y="5" font-size="13.8" font-weight="600" fill="#111827">

          ${lang === "fr" ? "Courbe de Gauss (μ=50, σ=20)" : "Gaussian curve (μ=50, σ=20)"}
        </text>
      </g>

      <text x="${margin.left + chartW / 2}" y="${height - 18}" text-anchor="middle" font-size="16" font-weight="600" fill="#111827">%</text>
      <text x="18" y="${margin.top + chartH / 2}" transform="rotate(-90 18 ${margin.top + chartH / 2})" text-anchor="middle" font-size="16" font-weight="600" fill="#111827">

        ${lang === "fr" ? "Densité" : "Density"}
      </text>
    </svg>
  `;
}

function buildGaussCurveSvgHF(
  rows: CsvRow[],
  category: string,
  element: string,
  lang: "fr" | "en",
  customTitle: string
) {

  const menRow = rows.find(
    (r) =>
      normalizeCurveLabel(getCurveRowLabel(r)) === normalizeCurveLabel(element) &&
      r["Groupe"] === "Hommes"
  );

  const womenRow = rows.find(
    (r) =>
      normalizeCurveLabel(getCurveRowLabel(r)) === normalizeCurveLabel(element) &&
      r["Groupe"] === "Femmes"
  );

  if (!menRow || !womenRow) return "";

  const menValue = getCurveValue(menRow);
  const womenValue = getCurveValue(womenRow);

  if (!Number.isFinite(menValue) || !Number.isFinite(womenValue)) return "";

  const menZ = getCurveZ(menRow, menValue);
  const womenZ = getCurveZ(womenRow, womenValue);
  const menP = getCurveP(menRow, menZ);
  const womenP = getCurveP(womenRow, womenZ);

  const width = 1500;
  const height = 650;
  const margin = { top: 72, right: 24, bottom: 62, left: 72 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const title =
    customTitle.trim() ||
    getCurveTitle(category, "hf", lang);

  const xScale = (x: number) =>
    margin.left + (Math.max(0, Math.min(100, x)) / 100) * chartW;

  const gauss = (x: number) => {
    const mu = 50;
    const sigma = 20;
    return (
      (1 / (sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2))
    );
  };

  const maxY = gauss(50) * 1.25;

  const yScale = (y: number) =>
    margin.top + chartH - (y / maxY) * chartH;

  const points = Array.from({ length: 401 }, (_, i) => {
    const x = (i / 400) * 100;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const leftArea = Array.from({ length: 41 }, (_, i) => {
    const x = (i / 40) * 5;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const centerArea = Array.from({ length: 361 }, (_, i) => {
    const x = 5 + (i / 360) * 90;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const rightArea = Array.from({ length: 41 }, (_, i) => {
    const x = 95 + (i / 40) * 5;
    return `${xScale(x)},${yScale(gauss(x))}`;
  }).join(" ");

  const label = getHistogramDisplayLabel(element, category, lang);

  const markerData = [
    {
      group: lang === "fr" ? "Hommes" : "Men",
      value: menValue,
      z: menZ,
      p: menP,
      color: "blue",
    },
    {
      group: lang === "fr" ? "Femmes" : "Women",
      value: womenValue,
      z: womenZ,
      p: womenP,
      color: "orange",
    },
  ];

  const orderedMarkers = [...markerData].sort((a, b) => a.value - b.value);
  const rankMap = new Map(
    orderedMarkers.map((marker, index) => [marker.group, index])
  );

  const markers = markerData
    .map((marker) => {
      const lineX = xScale(marker.value);
      const valueClamped = Math.max(0.1, Math.min(99.9, marker.value));
      const rank = rankMap.get(marker.group) ?? 0;

      const textAnchor =
        valueClamped >= 92
          ? "end"
          : valueClamped <= 8
            ? "start"
            : rank === 0
              ? "end"
              : "start";

      const textX =
        valueClamped >= 92
          ? lineX - 26
          : valueClamped <= 8
            ? lineX + 26
            : rank === 0
              ? lineX - 18
              : lineX + 18;

      const textY =
        margin.top +
        chartH -
        chartH * (rank === 0 ? 0.36 : 0.68);

      return `
        <line x1="${lineX}" y1="${margin.top}" x2="${lineX}" y2="${margin.top + chartH}" stroke="${marker.color}" stroke-width="1.6"/>

        <text x="${textX}" y="${textY}" text-anchor="${textAnchor}" font-size="12" font-weight="600" fill="${marker.color}">
          <tspan x="${textX}" dy="0" font-size="14" font-weight="700">${label}</tspan>
          <tspan x="${textX}" dy="14">μ = ${marker.value.toFixed(1)}%</tspan>
          <tspan x="${textX}" dy="14">Z=${marker.z >= 0 ? "+" : ""}${marker.z.toFixed(2)}</tspan>
          <tspan x="${textX}" dy="14">P=${marker.p.toFixed(3)}</tspan>
        </text>
      `;
    })
    .join("");

  const xTicks = Array.from({ length: 11 }, (_, i) => i * 10);
  const yTicks = Array.from({ length: 5 }, (_, i) => i * 0.005);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: Segoe UI, Arial, sans-serif;">
      <rect width="100%" height="100%" fill="#ffffff"/>

      <text x="${width / 2}" y="35" text-anchor="middle" font-size="20" font-weight="500" fill="#111827">
        ${title}
      </text>

      <polygon points="${xScale(0)},${yScale(0)} ${leftArea} ${xScale(5)},${yScale(0)}" fill="#eeeeee" opacity="0.5"/>
      <polygon points="${xScale(5)},${yScale(0)} ${centerArea} ${xScale(95)},${yScale(0)}" fill="#d0e6ff" opacity="0.42"/>
      <polygon points="${xScale(95)},${yScale(0)} ${rightArea} ${xScale(100)},${yScale(0)}" fill="#ffb347" opacity="0.65"/>

      <polyline points="${points}" fill="none" stroke="#708090" stroke-width="2.2"/>

      ${xTicks.map((x) => `
        <line x1="${xScale(x)}" y1="${margin.top}" x2="${xScale(x)}" y2="${margin.top + chartH}" stroke="#b8b8b8" stroke-width="1" stroke-dasharray="2 3" opacity="0.55"/>
        <text x="${xScale(x)}" y="${margin.top + chartH + 24}" text-anchor="middle" font-size="14" font-weight="500" fill="#111827">${x}</text>
      `).join("")}

      ${yTicks.map((y) => `
        <text x="${margin.left - 14}" y="${yScale(y) + 5}" text-anchor="end" font-size="14" font-weight="500" fill="#111827">${y.toFixed(3)}</text>
      `).join("")}

      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left + chartW}" y2="${margin.top}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left + chartW}" y1="${margin.top}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>

      ${markers}

      <g transform="translate(${margin.left + 6}, ${margin.top + 19})">
        <rect x="-2" y="-15" width="245" height="50" rx="5" ry="5" fill="white" opacity="0.94" stroke="#b8c0cc" stroke-width="1.35"/>
        <line x1="4" y1="0" x2="28" y2="0" stroke="#708090" stroke-width="2.2"/>
        <text x="36" y="5" font-size="13.8" font-weight="600" fill="#111827">
          ${lang === "fr" ? "Courbe de Gauss (μ=50, σ=20)" : "Gaussian curve (μ=50, σ=20)"}
        </text>
      </g>

      <g transform="translate(${margin.left + 6}, ${margin.top + 40})">
        <line x1="4" y1="0" x2="28" y2="0" stroke="blue" stroke-width="2"/>
        <text x="36" y="5" font-size="13.8" font-weight="600" fill="#111827">${lang === "fr" ? "Hommes" : "Men"}</text>
        <line x1="${lang === "fr" ? 108 : 102}" y1="0" x2="${lang === "fr" ? 132 : 126}" y2="0" stroke="orange" stroke-width="2"/>
        <text x="${lang === "fr" ? 140 : 134}" y="5" font-size="13.8" font-weight="600" fill="#111827">${lang === "fr" ? "Femmes" : "Women"}</text>
      </g>

      <text x="${margin.left + chartW / 2}" y="${height - 18}" text-anchor="middle" font-size="16" font-weight="600" fill="#111827">%</text>
      <text x="18" y="${margin.top + chartH / 2}" transform="rotate(-90 18 ${margin.top + chartH / 2})" text-anchor="middle" font-size="16" font-weight="600" fill="#111827">
        ${lang === "fr" ? "Densité" : "Density"}
      </text>
    </svg>
  `;
}

function buildKdeCurveSvg(
  rows: CsvRow[],
  category: string,
  element: string,
  lang: "fr" | "en",
  customTitle: string
) {
  const row = findKdeRow(rows, element);

  if (!row) return "";

  const values = getKdeValues(row);

  if (values.length < 3) return "";

  const observed =
    getKdeObservedValue(row);

  const expected =
    toNumber(row["moyenne"] ?? row["distribution_mean"] ?? row["Mean of distribution"] ?? row["Expected mean"]);

  const sigma =
    toNumber(row["ecart_type"] ?? row["std_dev"] ?? row["std"] ?? row["standard deviation"]);

  const width = 1500;
  const height = 650;
  const margin = { top: 72, right: 24, bottom: 62, left: 72 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const minValue = Math.min(...values, observed, expected);
  const maxValue = Math.max(...values, observed, expected);
  const span = Math.max(1, maxValue - minValue);
  const xMin = minValue - span * 0.18;
  const xMax = maxValue + span * 0.18;

  const bandwidth = kdeBandwidth(values);

  const xScale = (x: number) =>
    margin.left + ((x - xMin) / (xMax - xMin)) * chartW;

  const xValues = Array.from({ length: 501 }, (_, i) =>
    xMin + (i / 500) * (xMax - xMin)
  );

  const densities = xValues.map((x) =>
    kdeDensityAt(x, values, bandwidth)
  );

  const maxY = Math.max(...densities) * 1.18;

  const yScale = (y: number) =>
    margin.top + chartH - (y / maxY) * chartH;

  const points = xValues
    .map((x, i) => `${xScale(x)},${yScale(densities[i])}`)
    .join(" ");

  const areaPoints =
    `${xScale(xMin)},${yScale(0)} ` +
    points +
    ` ${xScale(xMax)},${yScale(0)}`;

  const title =
    customTitle.trim() ||
    getCurveTitle(category, "global", lang);

  const label = getHistogramDisplayLabel(element, category, lang);

  const observedX = xScale(observed);
  const expectedX = xScale(expected);

  const observedTextAnchor =
    observed > xMin + (xMax - xMin) * 0.78 ? "end" : "start";

  const observedTextX =
    observedTextAnchor === "end" ? observedX - 18 : observedX + 18;

  const expectedTextAnchor =
    expected > xMin + (xMax - xMin) * 0.78 ? "end" : "start";

  const expectedTextX =
    expectedTextAnchor === "end" ? expectedX - 18 : expectedX + 18;

  const tickCount = 9;
  const xTicks = Array.from({ length: tickCount }, (_, i) =>
    xMin + (i / (tickCount - 1)) * (xMax - xMin)
  );

  const yTicks = Array.from({ length: 5 }, (_, i) =>
    (i / 4) * maxY
  );

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: Segoe UI, Arial, sans-serif;">
      <rect width="100%" height="100%" fill="#ffffff"/>

      <text x="${width / 2}" y="35" text-anchor="middle" font-size="20" font-weight="500" fill="#111827">
        ${title}
      </text>

      <g transform="translate(${margin.left + chartW - 18}, ${margin.top + 20})">
        <rect
          x="-245"
          y="-17"
          width="250"
          height="58"
          rx="5"
          ry="5"
          fill="white"
          opacity="0.82"
        />
        <text x="0" y="0" text-anchor="end" font-size="13" font-weight="500" fill="#6b7280">
          μ = ${lang === "fr" ? "moyenne de la cohorte" : "cohort mean"}
        </text>
        <text x="0" y="16" text-anchor="end" font-size="13" font-weight="500" fill="#6b7280">
          σ = ${lang === "fr" ? "écart-type de la cohorte" : "cohort standard deviation"}
        </text>
        <text x="0" y="32" text-anchor="end" font-size="13" font-weight="500" fill="#6b7280">
          μ ${lang === "fr" ? "attendu = moyenne théorique" : "expected = theoretical mean"}
        </text>
      </g>

      <polygon points="${areaPoints}" fill="#eeeeee" opacity="0.45"/>
      <polyline points="${points}" fill="none" stroke="#2e8b57" stroke-width="2.4"/>

      ${xTicks.map((x) => `
        <line x1="${xScale(x)}" y1="${margin.top}" x2="${xScale(x)}" y2="${margin.top + chartH}" stroke="#b8b8b8" stroke-width="1" stroke-dasharray="2 3" opacity="0.55"/>
        <text x="${xScale(x)}" y="${margin.top + chartH + 24}" text-anchor="middle" font-size="14" font-weight="500" fill="#111827">${x.toFixed(1)}</text>
      `).join("")}

      ${yTicks.map((y) => `
        <text x="${margin.left - 14}" y="${yScale(y) + 5}" text-anchor="end" font-size="14" font-weight="500" fill="#111827">${y.toFixed(3)}</text>
      `).join("")}

      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left + chartW}" y2="${margin.top}" stroke="#111827" stroke-width="1.2"/>
      <line x1="${margin.left + chartW}" y1="${margin.top}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#111827" stroke-width="1.2"/>

      ${
        Number.isFinite(expected)
          ? `
            <line x1="${expectedX}" y1="${margin.top}" x2="${expectedX}" y2="${margin.top + chartH}" stroke="#777777" stroke-width="1.4" stroke-dasharray="6 5"/>
            <text x="${expectedTextX}" y="${margin.top + chartH * 0.30}" text-anchor="${expectedTextAnchor}" font-size="12" font-weight="600" fill="#777777">
              <tspan x="${expectedTextX}" dy="0">μ attendu = ${expected.toFixed(2)}</tspan>
            </text>
          `
          : ""
      }

      ${
        Number.isFinite(observed)
          ? `
            <line x1="${observedX}" y1="${margin.top}" x2="${observedX}" y2="${margin.top + chartH}" stroke="blue" stroke-width="1.6"/>
            <text x="${observedTextX}" y="${margin.top + chartH * 0.72}" text-anchor="${observedTextAnchor}" font-size="12" font-weight="600" fill="blue">
              <tspan x="${observedTextX}" dy="0" font-size="14" font-weight="700">${label}</tspan>
              <tspan x="${observedTextX}" dy="14">μ = ${observed.toFixed(2)}</tspan>
              ${
                Number.isFinite(sigma)
                  ? `<tspan x="${observedTextX}" dy="14">σ = ${sigma.toFixed(1)}</tspan>`
                  : ""
              }
            </text>
          `
          : ""
      }

      <g transform="translate(${margin.left + 6}, ${margin.top + 19})">
        <rect x="-2" y="-15" width="150" height="30" rx="5" ry="5" fill="white" opacity="0.94" stroke="#b8c0cc" stroke-width="1.35"/>
        <line x1="4" y1="0" x2="28" y2="0" stroke="#2e8b57" stroke-width="2.4"/>
        <text x="36" y="5" font-size="13.8" font-weight="600" fill="#111827">
          ${lang === "fr" ? "Courbe KDE" : "KDE curve"}
        </text>
      </g>

      <text x="${margin.left + chartW / 2}" y="${height - 18}" text-anchor="middle" font-size="16" font-weight="600" fill="#111827">
        ${lang === "fr" ? "Rang moyen" : "Mean rank"}
      </text>

      <text x="18" y="${margin.top + chartH / 2}" transform="rotate(-90 18 ${margin.top + chartH / 2})" text-anchor="middle" font-size="16" font-weight="600" fill="#111827">
        ${lang === "fr" ? "Densité" : "Density"}
      </text>
    </svg>
  `;
}

async function exportSvgDataUrlAsPng(dataUrl: string, filename: string) {
  const img = new Image();
  img.src = dataUrl;

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const footerHeight = 42;

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height + footerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = "#6b7280";
  ctx.font = "500 12px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("© 2025 GéoAstro v1.0", canvas.width / 2, img.height + 24);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });

  if (!blob) return;

  const pickerOptions = {
    suggestedName: filename,
    types: [
      {
        description: "Image PNG",
        accept: {
          "image/png": [".png"],
        },
      },
    ],
  };

  if ("showSaveFilePicker" in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker(pickerOptions);
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error(error);
    }
  }

  const pngUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = pngUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(pngUrl);
}

function statResultsFromCsvRows(rows: CsvRow[]): StatResult[] {
  return rows.map((row) => ({
    Catégorie: row["Catégorie astrologique"] ?? row["Catégorie"] ?? row["Categorie"] ?? "",
    effectif_reel: toNumber(row["Moyenne de l’échantillon"] ?? row["effectif_reel"]),
    moyenne: toNumber(row["Moyenne de la distribution"] ?? row["moyenne"]),
    ecart_type: toNumber(row["Écart-type"] ?? row["ecart_type"]),
    z_score: toNumber(row["Z-score"] ?? row["z_score"]),
    p_gt: toNumber(row["Proba empirique (surval)"] ?? row["p_gt"]),
    p_lt: toNumber(row["Proba empirique (sous-val)"] ?? row["p_lt"]),
    pval_gt: toNumber(row["P-value (surval)"] ?? row["pval_gt"]),
    pval_lt: toNumber(row["P-value (sous-val)"] ?? row["pval_lt"]),
  }));
}

function App() {
useEffect(() => {
  storeAccessTokenFromUrl();
}, []);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<StatResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [permutations, setPermutations] = useState(1000);
  const getInitialLang = (): "fr" | "en" => {
    const params = new URLSearchParams(window.location.search);
    return params.get("lang") === "en" ? "en" : "fr";
  };

  const [lang, setLang] = useState<"fr" | "en">(getInitialLang);
  const [activeTab, setActiveTab] = useState("analysis");
  const [cohorts, setCohorts] = useState<string[]>([]);

  const [selectedCohort, setSelectedCohort] = useState("");
  const [maleFile, setMaleFile] = useState<File | null>(null);
  const [femaleFile, setFemaleFile] = useState<File | null>(null);
  const [hfSummary, setHfSummary] = useState("");
  const [includeKDE, setIncludeKDE] = useState(false);
  const [histogramFile, setHistogramFile] = useState<File | null>(null);
  const [histogramRows, setHistogramRows] = useState<CsvRow[]>([]);
  const [histogramFileType, setHistogramFileType] =
    useState<"global" | "hf" | "unknown">("unknown");
  const [histogramNeedsManualGenerate, setHistogramNeedsManualGenerate] =
    useState(false);

  const [histogramPopulation, setHistogramPopulation] =
    useState("global");

  const [histogramCategory, setHistogramCategory] =
    useState("planetes");

  const [showZP, setShowZP] = useState(false);

  const [histogramTitle, setHistogramTitle] = useState("");

  const [histogramImage, setHistogramImage] =
    useState<string | null>(null);

  const [curveFile, setCurveFile] = useState<File | null>(null);
  const [curveRows, setCurveRows] = useState<CsvRow[]>([]);
  const [curvePopulation, setCurvePopulation] = useState("global");
  const [curveCategory, setCurveCategory] = useState("planetes");
  const [curveElement, setCurveElement] = useState("Lune");
  const [curveMode, setCurveMode] = useState("gauss");
  const [curveTitle, setCurveTitle] = useState("");
  const [curveImage, setCurveImage] = useState<string | null>(null);
  const [curveGeneratedOnce, setCurveGeneratedOnce] = useState(false);
  const [curveFileType, setCurveFileType] = useState<"global" | "hf" | "kde" | null>(null);
  const [isTrialMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hasAccessToken =
      params.has("access_token") ||
      sessionStorage.getItem("geoastro_stat_access_token");

    return params.get("trial") === "fields" && !hasAccessToken;
  });
  
  const [lastAnalysisData, setLastAnalysisData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [calculationDone, setCalculationDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");

    if (urlLang === "en") {
      setLang("en");
    }

    if (urlLang === "fr") {
      setLang("fr");
    }
  }, []);

    useEffect(() => {
    if (!isTrialMode) return;


    async function loadTrialFields() {
      const trialBaseUrl = "/trial";

      const [cohortText, resultsText, kdeText] = await Promise.all([
        fetch(`${trialBaseUrl}/fields_cohort.csv`).then((r) => r.text()),
        fetch(`${trialBaseUrl}/fields_results.csv`).then((r) => r.text()),
        fetch(`${trialBaseUrl}/fields_kde.csv`).then((r) => r.text()),
      ]);

      const resultsRows = parseCsvText(resultsText);
      const kdeRows = parseCsvText(kdeText);

      const cohortFile = new File([cohortText], "Les médaillés Fields.csv", {
        type: "text/csv",
      });

      const resultsFile = new File([resultsText], "Médaillés Fields - résultats.csv", {
        type: "text/csv",
      });

      setFile(cohortFile);
      setResults(statResultsFromCsvRows(resultsRows));
      setCalculationDone(true);

      setHistogramFile(resultsFile);
      setHistogramRows(resultsRows);
      setHistogramFileType("global");
      setHistogramPopulation("global");
      setHistogramNeedsManualGenerate(false);

const kdeFile = new File([kdeText], "fields_kde.csv", {
  type: "text/csv",
});

setCurveFile(kdeFile);
setCurveRows(kdeRows);
setCurveFileType("kde");
setCurvePopulation("global");
setCurveMode("gauss");
setCurveGeneratedOnce(true);

      setActiveTab("analysis");
    }

    loadTrialFields().catch((error) => {
      console.error(error);
      alert("Erreur lors du chargement du mode essai.");
    });
  }, [isTrialMode]);
  
  useEffect(() => {
fetch(`${API_BASE_URL}/cohorts/list?lang=${lang}`, {
  headers: getAccessHeaders(),
})
      .then((response) => response.json())
      .then((data) => {
        setCohorts(
          (data.files ?? []).map((name: string) =>
            name.replace(/\.csv$/i, "")
          )
        );
        setSelectedCohort("");
      })
      .catch((error) => {
        console.error(error);
        setCohorts([]);
      });
  }, [lang]);

  const handleUpload = async () => {
    if (!file) return;

setLoading(true);
setProgress(5);

const fileText = await readFileAsText(file);
const rowCount = parseCsvText(fileText).length || 1;
const estimatedDuration = estimateAnalysisDurationMs(rowCount, permutations);
const startedAt = Date.now();

const progressTimer = window.setInterval(() => {
  const elapsed = Date.now() - startedAt;
  const ratio = Math.min(elapsed / estimatedDuration, 1);

  const eased = 1 - Math.pow(1 - ratio, 2);
  const nextProgress = 5 + eased * 85;

  setProgress(Math.min(90, nextProgress));
}, 120);

    setResults([]);
    setLastAnalysisData(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("n", String(permutations));
    formData.append("lang", lang);

    try {
const response = await fetch(`${API_BASE_URL}/analysis/upload`, {
  method: "POST",
  headers: getAccessHeaders(),
  body: formData,
});

      if (!response.ok) {
        const message = await getApiErrorMessage(response);
        alert(message);
        return;
      }

      const data = await response.json();

      if (data.status === "success") {
        setResults(data.results);
        setLastAnalysisData(data);
        setCalculationDone(true);
      } else {
        alert(
          lang === "fr"
            ? "Erreur dans le calcul."
            : "Calculation error."
        );
      }
    } catch (error) {
      console.error(error);
      alert(
        lang === "fr"
          ? "Erreur API. Le serveur est temporairement indisponible."
          : "API error. The server is temporarily unavailable."
      );
    }

    window.clearInterval(progressTimer);
    setProgress(100);

    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
  };

  const txt = {
    fr: {
      analysis: "Analyse",
      cohorts: "Modèles & cohortes",
      hf: "Comparaison H/F",
      appName: "GéoAstro",
      histograms: "Histogrammes",
      curves: "Courbes",
      statisticalModule: "Module Statistique",
      parameters: "Paramètres d’analyse",
      loadCsv: "Charger fichier CSV",
      permutations: "Permutations",
      language: "Langue",
      launch: "Lancer le calcul statistique",
      loading: "Calcul en cours...",
      noResults: "Aucun résultat pour le moment.",
      noResults2:
        "Chargez un fichier CSV puis lancez le calcul statistique.",
      category: "Catégorie astrologique",
      sampleMean: "Moyenne de l’échantillon",
      distMean: "Moyenne de la distribution",
      std: "Écart-type",
      zscore: "Z-score",
      histogramPopulation: "Population",
      histogramCategory: "Catégorie",
      histogramStats: "Statistiques",
      histogramNoZP: "Ne pas afficher les z/p",
      histogramWithZP: "Afficher z-score et p-value",
      histogramCustomTitle: "Titre personnalisé",
      histogramGenerate: "Générer le graphique",
      histogramExport: "Exporter PNG",
      curvePopulation: "Population",
      curveCategory: "Catégorie",
      curveElement: "Élément",
      curveType: "Type de courbe",
      curveGaussian: "Gaussienne",
      curveKde: "KDE",
      curveHint:
        "Générer une courbe gaussienne (loi normale)\nou une courbe KDE (lissage empirique)",
      curveCustomTitle: "Titre personnalisé",
      curveGenerate: "Générer le graphique",
      curveExport: "Exporter PNG",
      curvePlaceholder:
        "Aucun résultat pour le moment.\nChargez un fichier CSV puis générez une courbe de distribution.",
    },

    en: {
      analysis: "Analysis",
      cohorts: "Models & cohorts",
      appName: "GeoAstro",
      hf: "M/F comparison",
      histograms: "Histograms",
      curves: "Curves",
      statisticalModule: "Statistical Module",
      parameters: "Analysis settings",
      loadCsv: "Load CSV file",
      permutations: "Permutations",
      language: "Language",
      launch: "Launch statistical calculation",
      loading: "Calculation in progress...",
      noResults: "No results yet.",
      noResults2:
        "Load a CSV file and launch the statistical calculation.",
      category: "Astrological category",
      sampleMean: "Sample mean",
      distMean: "Distribution mean",
      std: "Std. dev.",
      zscore: "Z-score",
      histogramPopulation: "Population",
      histogramCategory: "Category",
      histogramStats: "Statistics",
      histogramNoZP: "Do not display z/p",
      histogramWithZP: "Display z-score and p-value",
      histogramCustomTitle: "Custom title",
      histogramGenerate: "Generate chart",
      histogramExport: "Export PNG",
      curvePopulation: "Population",
      curveCategory: "Category",
      curveElement: "Item",
      curveType: "Curve type",
      curveGaussian: "Gaussian",
      curveKde: "KDE",
      curveHint:
        "Generate a Gaussian curve (normal distribution)\nor a KDE curve (smoothed empirical)",
      curveCustomTitle: "Custom title",
      curveGenerate: "Generate chart",
      curveExport: "Export PNG",
      curvePlaceholder:
        "No result yet.\nLoad a CSV file and generate a distribution curve.",
    },
  }[lang];

  const curveElementOptions =
    (curvePopulation === "hf" || curveMode === "kde") &&
    curveCategory === "familles_zodiacales"
      ? (histogramCategoryMap[curveCategory] ?? histogramCategoryMap.planetes).filter(
          (item) =>
            ![
              "[catégorie] types de réaction",
              "[catégorie] mobilités",
              "[catégorie] phases",
            ].includes(item)
        )
      : histogramCategoryMap[curveCategory] ?? histogramCategoryMap.planetes;

  useEffect(() => {
    if (!curveElementOptions.includes(curveElement)) {
      setCurveElement(curveElementOptions[0]);
    }
  }, [curveElementOptions, curveElement]);

  useEffect(() => {
    if (!curveGeneratedOnce || !curveFile || !curveRows.length) {
      return;
    }

    const svg =
      curveMode === "kde"
        ? buildKdeCurveSvg(
            curveRows,
            curveCategory,
            curveElement,
            lang,
            curveTitle
          )
        : curvePopulation === "hf"
          ? buildGaussCurveSvgHF(
              curveRows,
              curveCategory,
              curveElement,
              lang,
              curveTitle
            )
          : buildGaussCurveSvg(
              curveRows,
              curveCategory,
              curveElement,
              curvePopulation,
              lang,
              curveTitle
            );

    if (!svg) {
      setCurveImage(null);
      return;
    }

    const dataUrl =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svg);

    setCurveImage(dataUrl);
  }, [
    curveGeneratedOnce,
    curveFile,
    curveRows,
    curveMode,
    curvePopulation,
    curveCategory,
    curveElement,
    curveTitle,
    lang,
  ]);

  useEffect(() => {
    if (histogramNeedsManualGenerate) {
      return;
    }

    if (!histogramRows.length || !histogramFile) return;

    const svg =
      histogramPopulation === "hf"
        ? buildHistogramSvgHF(
            histogramRows,
            histogramCategory,
            lang,
            showZP,
            histogramTitle
          )
        : buildHistogramSvg(
            histogramRows,
            histogramCategory,
            lang,
            showZP,
            histogramTitle
          );

    const dataUrl =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svg);

    setHistogramImage(dataUrl);
  }, [
    histogramNeedsManualGenerate,
    histogramRows,
    histogramFile,
    showZP,
    histogramPopulation,
    histogramCategory,
    histogramTitle,
    lang,
  ]);

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        width: "100vw",
        maxWidth: "100vw",
        overflowX: "hidden",
        overflowY: "hidden",
        backgroundColor: "#FAFAF7",
        fontFamily: "Segoe UI, Arial, sans-serif",
        color: "#111827",
      }}
    >
<div
  className="stat-tabs"
  style={{
    display: "flex",
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: TAB_BG,
  }}
>
        {[
          { key: "analysis", label: txt.analysis },
          { key: "cohorts", label: txt.cohorts },
          { key: "hf", label: txt.hf },
          { key: "histograms", label: txt.histograms },
          { key: "curves", label: txt.curves },
        ].map((tab) => (
          <HelpTooltip
            key={tab.key}
            lang={lang}
            tooltipKey={`tab_${tab.key}` as TooltipKey}
            position="bottom"
            safeLeft={tab.key === "analysis" || tab.key === "cohorts"}
          >
<div
  className="stat-tab"
  onClick={() => setActiveTab(tab.key)}
  style={{
              padding: "8px 20px",
              borderRight: `1px solid ${BORDER}`,
              borderTop:
                activeTab === tab.key
                  ? "2px solid #d69b00"
                  : "2px solid transparent",
              backgroundColor:
                activeTab === tab.key ? ACTIVE_TAB_BG : TAB_BG,
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.15s ease",
            }}
          >
              {tab.label}
            </div>
          </HelpTooltip>
        ))}
        <div
          onClick={async () => {
            try {
              await fetch("https://geoastro.org/api/auth/logout", {
                method: "POST",
                credentials: "include",
              });
            } finally {
              window.location.href = "https://geoastro.org/";
            }
          }}
          style={{
            marginLeft: "auto",
            padding: "8px 20px",
            borderLeft: `1px solid ${BORDER}`,
            borderTop: "2px solid transparent",
            backgroundColor: TAB_BG,
            fontWeight: 400,
            cursor: "pointer",
            fontSize: 13,
            transition: "all 0.15s ease",
          }}
        >
          {lang === "fr" ? "Déconnexion" : "Log out"}
        </div>
      </div>

      {activeTab === "cohorts" && (
        <div className="stat-cohorts-panel" style={{ padding: "24px 10px 40px" }}>
          <h2 style={{ textAlign: "center", fontSize: 18 }}>
            Modèle CSV (FR)
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              margin: "0 auto 10px",
              border: "1px solid #9ca3af",
              backgroundColor: "white",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                {["Nom", "Jour", "Mois", "Année", "HeureTU", "MinuteTU", "Latitude", "Longitude"].map((col) => (
                  <th key={col} style={{ padding: "4px 8px", borderBottom: "1px solid #d1d5db", textAlign: "left" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Anonyme X", "1", "1", "2000", "12", "00", "45.00N", "2.00E"],
                ["Anonyme Y", "2", "2", "2000", "12", "00", "30.00S", "4.00O"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "4px 8px", textAlign: "left" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "center", marginBottom: 18 }}>
          <HelpTooltip lang={lang} tooltipKey="model_export_fr">
            <button
              style={buttonStyle}
              onClick={() =>
                downloadTextFile(
                  "modele_csv_fr.csv",
                  "Nom;Jour;Mois;Année;HeureTU;MinuteTU;Latitude;Longitude\nAnonyme X;1;1;2000;12;00;45.00N;2.00E\nAnonyme Y;2;2;2000;12;00;30.00S;4.00O"
                )
              }
            >
              Exporter modèle CSV
            </button>
          </HelpTooltip>
          </div>

          <h2 style={{ textAlign: "center", fontSize: 18 }}>
            CSV Template (EN)
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              margin: "0 auto 10px",
              border: "1px solid #9ca3af",
              backgroundColor: "white",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                {["Name", "Day", "Month", "Year", "HourUT", "MinuteUT", "Latitude", "Longitude"].map((col) => (
                  <th key={col} style={{ padding: "4px 8px", borderBottom: "1px solid #d1d5db", textAlign: "left" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Anonymous X", "1", "1", "2000", "12", "00", "45.00N", "2.00E"],
                ["Anonymous Y", "2", "2", "2000", "12", "00", "30.00S", "4.00W"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "4px 8px", textAlign: "left" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
          <HelpTooltip lang={lang} tooltipKey="model_export_en">
            <button
              style={buttonStyle}
              onClick={() =>
                downloadTextFile(
                  "csv_template_en.csv",
                  "Name;Day;Month;Year;HourUT;MinuteUT;Latitude;Longitude\nAnonymous X;1;1;2000;12;00;45.00N;2.00E\nAnonymous Y;2;2;2000;12;00;30.00S;4.00W"
                )
              }
            >
              Export CSV Template
            </button>
          </HelpTooltip>
          </div>

          <hr />

          <p style={{ fontStyle: "italic", marginLeft: 30 }}>
            {lang === "fr" ? "Note méthodologique" : "Methodological note"}
          </p>

          <p
            style={{
              maxWidth: 1450,
              margin: "0 auto 20px",
              lineHeight: 1.4,
              fontSize: 14,
            }}
          >
            {lang === "fr"
              ? "Les cohortes proposées ci-dessous correspondent à des ensembles de données ayant servi de base à des travaux publiés ou à des analyses statistiques documentées. Certaines cohortes ont été initialement constituées et analysées à l’aide d’outils antérieurs, tandis que d’autres ont été traitées directement avec GéoAstro. Les éventuelles différences observées dans les résultats reflètent des choix méthodologiques propres à chaque approche statistique et n’affectent pas les grandes tendances générales mises en évidence."
              : "The cohorts provided below correspond to datasets that formed the basis of published studies or documented statistical analyses. Some cohorts were originally constructed and analysed using earlier tools, while others were processed directly with GeoAstro. Any differences observed in the results reflect methodological choices specific to each statistical approach and do not affect the main overall trends identified."}
          </p>

          <h2 style={{ textAlign: "center", fontSize: 18 }}>
            <HelpTooltip lang={lang} tooltipKey="integrated_cohorts" position="bottom">
              <span>{lang === "fr" ? "Cohortes intégrées" : "Built-in cohorts"}</span>
            </HelpTooltip>
          </h2>

          <div
            style={{
              width: 950,
              height: 200,
              margin: "0 auto",
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              overflowY: "auto",
              padding: 8,
              fontSize: 15,
            }}
          >
            {cohorts.map((cohort) => (
              <div
                key={cohort}
                onClick={() => setSelectedCohort(cohort)}
                style={{
                  padding: "2px 8px",
                  fontSize: 16,
                  lineHeight: "20px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedCohort === cohort ? "#dbeafe" : "transparent",
                  border:
                    selectedCohort === cohort
                      ? "1px solid #93c5fd"
                      : "1px solid transparent",
                }}
              >
                {cohort}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <HelpTooltip lang={lang} tooltipKey="export_selected_cohort">
              <button
            style={{
              ...buttonStyle,

              backgroundColor:
                !selectedCohort ||
                (isTrialMode &&
                  !isTrialAllowedCohort(selectedCohort, lang))
                  ? "#e5e7eb"
                  : "#f3f4f6",

              cursor:
                !selectedCohort ||
                (isTrialMode &&
                  !isTrialAllowedCohort(selectedCohort, lang))
                  ? "not-allowed"
                  : "pointer",
            }}

            disabled={
              !selectedCohort ||
              (isTrialMode &&
                !isTrialAllowedCohort(selectedCohort, lang))
            }

            onClick={async () => {
              if (
                !selectedCohort ||
                (isTrialMode &&
                  !isTrialAllowedCohort(selectedCohort, lang))
              ) {
                return;
              }

                const filename = selectedCohort.endsWith(".csv")
                  ? selectedCohort
                  : `${selectedCohort}.csv`;

const url =
  `${API_BASE_URL}/cohorts/download?lang=${lang}&name=${encodeURIComponent(filename)}`;

const response = await fetch(url, {
  headers: getAccessHeaders(),
});

                if (!response.ok) {
                  alert("Erreur export cohorte");
                  return;
                }

                const blob = await response.blob();

                await saveBlobFile(filename, blob);
              }}
            >
              {lang === "fr" ? "Exporter la cohorte sélectionnée" : "Export selected cohort"}
            </button>
            </HelpTooltip>
          </div>
        </div>
      )}

      {activeTab === "hf" && (
        <div className="stat-hf-panel" style={{ padding: "24px 10px 40px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className="stat-hf-row" style={{ display: "grid", gridTemplateColumns: "150px 1fr 120px", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <label>{lang === "fr" ? "Fichier Hommes :" : "Male file:"}</label>

              <input
                value={maleFile ? maleFile.name : ""}
                readOnly
                style={inputStyle}
              />

              <HelpTooltip lang={lang} tooltipKey="hf_browse_m">
                <label
                  style={{
                    ...buttonStyle,
                    textAlign: "center",
                    backgroundColor: isTrialMode ? "#e5e7eb" : "#f3f4f6",
                    cursor: isTrialMode ? "not-allowed" : "pointer",
                  }}
                >
                  {lang === "fr" ? "Parcourir..." : "Browse..."}
                  <input
                    type="file"
                    accept=".csv"
                    disabled={isTrialMode}
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      if (isTrialMode) return;

                      const f = e.target.files?.[0] ?? null;

                      if (!f) {
                        setMaleFile(null);
                        setHfSummary("");
                        return;
                      }

                      const text = await readFileAsText(f);
                      const rows = parseCsvText(text);
                      const fileType = detectHistogramCsvType(rows);

                      if (fileType !== "global") {
                        alert(
                          lang === "fr"
                            ? "Le fichier Hommes doit être un fichier de résultats statistiques exporté depuis l’onglet Analyse."
                            : "The male file must be a statistical results file exported from the Analysis tab."
                        );

                        setMaleFile(null);
                        setHfSummary("");
                        e.target.value = "";
                        return;
                      }

                      setMaleFile(f);
                      setHfSummary("");
                    }}
                  />
                </label>
              </HelpTooltip>
            </div>

            <div className="stat-hf-row" style={{ display: "grid", gridTemplateColumns: "150px 1fr 120px", gap: 10, alignItems: "center", marginBottom: 18 }}>
              <label>{lang === "fr" ? "Fichier Femmes :" : "Female file:"}</label>

              <input
                value={femaleFile ? femaleFile.name : ""}
                readOnly
                style={inputStyle}
              />

              <HelpTooltip lang={lang} tooltipKey="hf_browse_f">
                <label
                  style={{
                    ...buttonStyle,
                    textAlign: "center",
                    backgroundColor: isTrialMode ? "#e5e7eb" : "#f3f4f6",
                    cursor: isTrialMode ? "not-allowed" : "pointer",
                  }}
                >
                  {lang === "fr" ? "Parcourir..." : "Browse..."}
                  <input
                    type="file"
                    accept=".csv"
                    disabled={isTrialMode}
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      if (isTrialMode) return;

                      const f = e.target.files?.[0] ?? null;

                      if (!f) {
                        setFemaleFile(null);
                        setHfSummary("");
                        return;
                      }

                      const text = await readFileAsText(f);
                      const rows = parseCsvText(text);
                      const fileType = detectHistogramCsvType(rows);

                      if (fileType !== "global") {
                        alert(
                          lang === "fr"
                            ? "Le fichier Femmes doit être un fichier de résultats statistiques exporté depuis l’onglet Analyse."
                            : "The female file must be a statistical results file exported from the Analysis tab."
                        );

                        setFemaleFile(null);
                        setHfSummary("");
                        e.target.value = "";
                        return;
                      }

                      setFemaleFile(f);
                      setHfSummary("");
                    }}
                  />
                </label>
              </HelpTooltip>
            </div>

            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <HelpTooltip lang={lang} tooltipKey="hf_generate">
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor:
                      isTrialMode || !maleFile || !femaleFile
                        ? "#e5e7eb"
                        : "#f3f4f6",
                    cursor:
                      isTrialMode || !maleFile || !femaleFile
                        ? "not-allowed"
                        : "pointer",
                  }}
                  disabled={isTrialMode || !maleFile || !femaleFile}

                  onClick={async () => {
                  if (isTrialMode || !maleFile || !femaleFile) return;

                  const formData = new FormData();
                  formData.append("male_file", maleFile);
                  formData.append("female_file", femaleFile);

                  try {
const response = await fetch(`${API_BASE_URL}/hf-merge`, {
  method: "POST",
  headers: getAccessHeaders(),
  body: formData,
});

                    if (!response.ok) {
                      alert("Erreur API H/F");
                      return;
                    }

                    const blob = await response.blob();
                    const summaryHeader = response.headers.get("X-HF-Summary");

                    await saveBlobFile("merged_hf.csv", blob);

                    setHfSummary(
                      summaryHeader
                        ? decodeURIComponent(summaryHeader).replaceAll(" | ", "\n")
                        : "CSV H/F généré avec succès."
                    );
                  } catch (error) {
                    console.error(error);
                    alert("Erreur API H/F");
                  }
                }}
                  >
                    {lang === "fr" ? "Générer CSV H/F" : "Generate H/F CSV"}
                  </button>
                </HelpTooltip>
            </div>

            <div className="stat-hf-summary-row" style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
              <HelpTooltip lang={lang} tooltipKey="hf_summary" position="right">
                <label style={{ paddingTop: 8 }}>
                  {lang === "fr" ? "Résumé :" : "Summary:"}
                </label>
              </HelpTooltip>

              <textarea
                value={hfSummary}
                readOnly
                style={{
                  height: 170,
                  resize: "none",
                  padding: 10,
                  border: "1px solid #cfd6df",
                  backgroundColor: "white",
                  fontFamily: "Segoe UI, Arial, sans-serif",
                }}
              />
            </div>
          </div>
        </div>
      )}

{activeTab === "histograms" && (
  <div
    className="stat-chart-panel"
    style={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 44px)",
            backgroundColor: "#FAFAF7",
          }}
        >
          <div
            style={{
              minHeight: 275,
              position: "relative",
            }}
          >
            <div
              className="stat-logo-block"
              style={{
                position: "absolute",
                left: 68,
                top: 36,
                width: 220,
                textAlign: "center",
              }}
            >
              <img
                src="/logo.svg"
                alt="GéoAstro"
                style={{
                  width: 115,
                  display: "block",
                  margin: "0 auto 10px",
                }}
              />

              <div
                style={{
                  fontSize: 34,
                  fontFamily: "Georgia, serif",
                }}
              >
                {txt.appName}
              </div>

              <div
                style={{
                  fontSize: 15,
                  color: "#374151",
                }}
              >
                {txt.statisticalModule}
              </div>
            </div>

            <fieldset
              style={{
                width: 500,
                margin: "6px auto 10px",
                border: "1px solid #cfd6df",
                backgroundColor: "#FAFAF7",
                padding: "4px 18px 6px",
              }}
            >
              <legend
                style={{
                  fontWeight: 700,
                  color: "#374151",
                  fontSize: 13,
                  padding: "0 8px",
                }}
              >
                <span style={{ fontSize: 14 }}>⚙️</span> {txt.parameters}
              </legend>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <HelpTooltip
                  lang={lang}
                  tooltipKey="hist_select_file"
                  position="bottom"
                  safeLeft
                >
<label
  title={
    isTrialMode
      ? lang === "fr"
        ? "Mode essai : chargement de fichier réservé à la version complète."
        : "Trial mode: file loading is reserved for the full version."
      : UI_TOOLTIPS[lang].hist_select_file
  }
  style={{
    ...buttonStyle,
    cursor: isTrialMode ? "not-allowed" : "pointer",
  }}
>
                    {txt.loadCsv}

<input
  type="file"
  accept=".csv"
  disabled={isTrialMode}
  style={{ display: "none" }}
  onChange={async (e) => {
    if (isTrialMode) return;

    const f = e.target.files?.[0] ?? null;

                    if (!f) {
                      setHistogramFile(null);
                      setHistogramRows([]);
                      setHistogramImage(null);
                      setHistogramFileType("unknown");
                      return;
                    }

                    const text = await readFileAsText(f);
                    const rows = parseCsvText(text);
                    const fileType = detectHistogramCsvType(rows);

                    if (fileType === "invalid") {
                      alert(
                        lang === "fr"
                          ? "Ce fichier ne semble pas être un fichier de résultats statistiques exporté depuis l’onglet Analyse."
                          : "This file does not appear to be a statistical results file exported from the Analysis tab."
                      );

                      setHistogramFile(null);
                      setHistogramRows([]);
                      setHistogramImage(null);
                      setHistogramFileType("unknown");
                      e.target.value = "";
                      return;
                    }

                    setHistogramFile(f);
                    setHistogramRows(rows);
                    setHistogramImage(null);
                    setHistogramFileType(fileType);
                    setHistogramNeedsManualGenerate(true);

                    if (fileType === "hf") {
                      setHistogramPopulation("hf");
                    }

                    if (fileType === "global") {
                      setHistogramPopulation("global");
                    }
                  }}
                  />
                  </label>
                </HelpTooltip>

                <input
                  value={histogramFile ? histogramFile.name : ""}
                  readOnly
                  style={{
                    ...inputStyle,
                    flex: 1,
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 26,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    {txt.histogramPopulation} :
                  </div>

                  <select
                    title={UI_TOOLTIPS[lang].chart_population}
                    value={histogramPopulation}

                    onChange={(e) =>
                      setHistogramPopulation(e.target.value)
                    }
                    style={{
                      ...compactInputStyle,
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <option
                      value="global"
                      disabled={histogramFileType === "hf"}
                    >
                      Global
                    </option>

                    <option
                      value="hf"
                      disabled={histogramFileType === "global"}
                    >
                      {lang === "fr" ? "H/F" : "M/F"}
                    </option>
                  </select>

                </div>

                <div>
                  <div
                    style={{
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    {txt.histogramCategory} :
                  </div>

                  <select
                    title={UI_TOOLTIPS[lang].chart_category}
                    value={histogramCategory}
                    onChange={(e) =>
                      setHistogramCategory(e.target.value)
                    }
                    style={{
                      ...compactInputStyle,
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <option value="planetes">
                      {lang === "fr" ? "Planètes" : "Planets"}
                    </option>

                    <option value="ret">
                      {lang === "fr" ? "Familles RET" : "RET families"}
                    </option>

                    <option value="signes">
                      {lang === "fr"
                        ? "Signes du zodiaque"
                        : "Zodiac signs"}
                    </option>

                    <option value="familles_zodiacales">
                      {lang === "fr"
                        ? "Familles zodiacales"
                        : "Zodiac families"}
                    </option>

                    <option value="angularites">
                      {lang === "fr"
                        ? "Zones d’angularité"
                        : "Angular zones"}
                    </option>

                    <option value="maisons">
                      {lang === "fr" ? "Maisons" : "Houses"}
                    </option>

                    <option value="quadrants">
                      Quadrants
                    </option>

                    <option value="hemispheres">
                      {lang === "fr" ? "Hémisphères" : "Hemispheres"}
                    </option>

                    <option value="aspects">
                      Aspects
                    </option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginBottom: 10,
                  fontSize: 13,
                  display: "grid",
                  gridTemplateColumns: "95px 1fr",
                  columnGap: 10,
                  alignItems: "start",
                }}
              >
                <div>
                  {txt.histogramStats} :
                </div>

                <div>
                  <HelpTooltip
                    lang={lang}
                    tooltipKey="hist_stats_hide"
                    position="right"
                  >
                    <label
                      style={{
                        display: "block",
                        lineHeight: "17px",
                        marginBottom: 0,
                      }}
                    >
                      <input
                        type="radio"
                        checked={!showZP}
                        onChange={() => setShowZP(false)}
                      />{" "}
                      {txt.histogramNoZP}
                    </label>
                  </HelpTooltip>

                  <br />

                  <HelpTooltip
                    lang={lang}
                    tooltipKey="hist_stats_show"
                    position="right"
                  >
                    <label
                      style={{
                        display: "block",
                        lineHeight: "17px",
                        marginBottom: 0,
                      }}
                    >
                      <input
                        type="radio"
                        checked={showZP}
                        onChange={() => setShowZP(true)}
                      />{" "}
                      {txt.histogramWithZP}
                    </label>
                  </HelpTooltip>
                </div>
              </div>

              <div
                style={{
                  marginBottom: 6,
                  display: "grid",
                  gridTemplateColumns: "115px 1fr",
                  columnGap: 8,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                  }}
                >
                  {txt.histogramCustomTitle} :
                </div>

                <input
                  title={UI_TOOLTIPS[lang].chart_custom_title}
                  value={histogramTitle}
                  onChange={(e) =>
                    setHistogramTitle(e.target.value)
                  }
                  style={{
                    ...inputStyle,
                    width: "calc(100% - 16px)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <HelpTooltip
                  lang={lang}
                  tooltipKey="hist_generate"
                  position="bottom"
                >
                  <button
                    style={{
                      ...buttonStyle,
                      padding: "6px 14px",
                      backgroundColor: !histogramFile ? "#e5e7eb" : "#f3f4f6",
                      cursor: !histogramFile ? "not-allowed" : "pointer",
                    }}
                    disabled={!histogramFile}

                  onClick={async () => {
                    if (!histogramFile) return;

                    setHistogramNeedsManualGenerate(false);

                    const text =
                      await readFileAsText(histogramFile);

                    const rows = parseCsvText(text);
                    setHistogramRows(rows);

                    const svg =
                      histogramPopulation === "hf"
                        ? buildHistogramSvgHF(
                            rows,
                            histogramCategory,
                            lang,
                            showZP,
                            histogramTitle
                          )
                        : buildHistogramSvg(
                            rows,
                            histogramCategory,
                            lang,
                            showZP,
                            histogramTitle
                          );

                    const dataUrl =
                      "data:image/svg+xml;charset=utf-8," +
                      encodeURIComponent(svg);

                    setHistogramImage(dataUrl);
                  }}

                >
                  {txt.histogramGenerate}
                </button>
                </HelpTooltip>

                {histogramImage && (
                  <HelpTooltip
                    lang={lang}
                    tooltipKey="hist_export"
                    position="bottom"
                    safeRight
                  >
                    <button
                      style={{
                        ...buttonStyle,
                        padding: "6px 14px",
                        backgroundColor: isTrialMode ? "#e5e7eb" : "#f3f4f6",
                        cursor: isTrialMode ? "not-allowed" : "pointer",
                      }}
                      disabled={isTrialMode}
                      onClick={async () => {
                        if (isTrialMode) return;

                        await exportSvgDataUrlAsPng(
                          histogramImage,
                          "histogramme_geoastro.png"
                        );
                      }}
                    >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <img
                        src="/icon_save.png"
                        alt=""
                        style={{
                          width: 15,
                          height: 15,
                        }}
                      />
                      {txt.histogramExport}
                    </span>
                  </button>
                  </HelpTooltip>
                )}
              </div>
            </fieldset>
          </div>

          <div
            style={{
              flex: 1,
              margin: "0 28px 0",
              border: "1px solid #9ca3af",
              backgroundColor: "white",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!histogramImage ? (
              <div
                style={{
                  color: "#9ca3af",
                  textAlign: "center",
                  fontStyle: "italic",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Aucun résultat pour le moment.
                <br />
                Chargez un fichier CSV puis générez un histogramme.
              </div>
            ) : (
              <img
                src={histogramImage}
                alt="Histogramme"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
          <div
            style={{
              height: 22,
              textAlign: "center",
              fontSize: 12,
              color: "#6b7280",
              lineHeight: "22px",
            }}
          >
            © 2025 GéoAstro v1.0
          </div>
        </div>
      )}

{activeTab === "curves" && (
  <div
    className="stat-chart-panel"
    style={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 44px)",
            backgroundColor: "#FAFAF7",
          }}
        >
          <div
            style={{
              minHeight: 275,
              position: "relative",
            }}
          >
            <div
              className="stat-logo-block"
              style={{
                position: "absolute",
                left: 68,
                top: 36,
                width: 220,
                textAlign: "center",
              }}
            >
              <img
                src="/logo.svg"
                alt="GéoAstro"
                style={{
                  width: 115,
                  display: "block",
                  margin: "0 auto 10px",
                }}
              />

              <div
                style={{
                  fontSize: 34,
                  fontFamily: "Georgia, serif",
                }}
              >
                {txt.appName}
              </div>

              <div
                style={{
                  fontSize: 15,
                  color: "#374151",
                }}
              >
                {txt.statisticalModule}
              </div>
            </div>

            <fieldset
              style={{
                width: 560,
                margin: "6px auto 10px",
                border: "1px solid #cfd6df",
                backgroundColor: "#FAFAF7",
                padding: "4px 18px 6px",
              }}
            >
              <legend
                style={{
                  fontWeight: 700,
                  color: "#374151",
                  fontSize: 13,
                  padding: "0 8px",
                }}
              >
                <span style={{ fontSize: 14 }}>⚙️</span> {txt.parameters}
              </legend>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
<label
  title={
    isTrialMode
      ? lang === "fr"
        ? "Mode essai : chargement de fichier réservé à la version complète."
        : "Trial mode: file loading is reserved for the full version."
      : UI_TOOLTIPS[lang].curve_select_file
  }
  style={{
    ...buttonStyle,
    cursor: isTrialMode ? "not-allowed" : "pointer",
  }}
>
                  {txt.loadCsv}
<input
  type="file"
  accept=".csv"
  disabled={isTrialMode}
  style={{ display: "none" }}
  onChange={async (e) => {
    if (isTrialMode) return;

    const f = e.target.files?.[0] ?? null;

                      if (!f) {
                        setCurveFile(null);
                        setCurveRows([]);
                        setCurveImage(null);
                        setCurveGeneratedOnce(false);
                        setCurveFileType(null);
                        return;
                      }

                      const text = await readFileAsText(f);
                      const rows = parseCsvText(text);
                      const fileType = detectCurveCsvType(rows);

                      if (fileType === "invalid") {
                        alert(
                          lang === "fr"
                            ? "Ce fichier ne semble pas être un fichier de résultats statistiques exporté depuis l’onglet Analyse."
                            : "This file does not appear to be a statistical results file exported from the Analysis tab."
                        );

                        setCurveFile(null);
                        setCurveRows([]);
                        setCurveImage(null);
                        setCurveGeneratedOnce(false);
                        setCurveFileType(null);
                        e.target.value = "";
                        return;
                      }

                      if (!rows.length) {
                        alert(
                          lang === "fr"
                            ? "Ce fichier CSV semble vide ou invalide."
                            : "This CSV file appears to be empty or invalid."
                        );

                        setCurveFile(null);
                        setCurveRows([]);
                        setCurveImage(null);
                        setCurveGeneratedOnce(false);
                        setCurveFileType(null);
                        e.target.value = "";
                        return;
                      }

                      setCurveFileType(fileType);

                      if (fileType === "hf") {
                        setCurvePopulation("hf");
                        setCurveMode("gauss");
                      } else if (fileType === "kde") {
                        setCurvePopulation("global");
                        setCurveMode("gauss");
                      } else {
                        setCurvePopulation("global");
                        setCurveMode("gauss");
                      }
                      setCurveFile(f);
                      setCurveRows(rows);
                      setCurveImage(null);
                      setCurveGeneratedOnce(false);
                    }}
                  />
                </label>

                <input
                  value={curveFile ? curveFile.name : ""}
                  readOnly
                  style={{
                    ...inputStyle,
                    flex: 1,
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 28,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    {txt.curvePopulation} :
                  </div>

<select
  title={UI_TOOLTIPS[lang].chart_population}
  value={curvePopulation}
  onChange={(e) => setCurvePopulation(e.target.value)}
  style={{
    ...compactInputStyle,
    width: "100%",
    cursor: "pointer",
  }}
>
  <option
    value="global"
    disabled={curveFileType === "hf"}
  >
    Global
  </option>

  <option
    value="hf"
    disabled={curveFileType === "global" || curveFileType === "kde"}
  >
    {lang === "fr" ? "Comparer H/F" : "Compare M/F"}
  </option>
</select>

                  <div
                    style={{
                      marginTop: 8,
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    {txt.curveType} :
                  </div>

                  <label
                    title={UI_TOOLTIPS[lang].curve_mode_gauss}
                    style={{
                      display: "block",
                      lineHeight: "18px",
                      fontSize: 13,
                      transform: "translateY(-2px)",
                    }}
                  >
                    <input
                      type="radio"
                      checked={curveMode === "gauss"}
                      onChange={() => setCurveMode("gauss")}
                    />{" "}
                    {txt.curveGaussian}
                  </label>

                  <label
                    title={UI_TOOLTIPS[lang].curve_mode_kde}
                    style={{
                      display: "block",
                      lineHeight: "18px",
                      fontSize: 13,
                      transform: "translateY(2px)",
                    }}
                  >
                    <input
                      type="radio"
                      checked={curveMode === "kde"}
                      disabled={curveFileType !== "kde"}
                      onChange={() => {
                        setCurveMode("kde");
                        setCurvePopulation("global");
                      }}
                    />{" "}
                    {txt.curveKde}
                  </label>
                </div>

                <div>
                  <div
                    style={{
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    {txt.curveCategory} :
                  </div>

                  <select
                    title={UI_TOOLTIPS[lang].chart_category}
                    value={curveCategory}
                    onChange={(e) => setCurveCategory(e.target.value)}
                    style={{
                      ...compactInputStyle,
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <option value="planetes">
                      {lang === "fr" ? "Planètes" : "Planets"}
                    </option>

                    <option value="ret">
                      {lang === "fr" ? "Familles RET" : "RET families"}
                    </option>

                    <option value="signes">
                      {lang === "fr"
                        ? "Signes du zodiaque"
                        : "Zodiac signs"}
                    </option>

                    <option value="familles_zodiacales">
                      {lang === "fr"
                        ? "Familles zodiacales"
                        : "Zodiac families"}
                    </option>

                    <option value="angularites">
                      {lang === "fr"
                        ? "Zones d’angularité"
                        : "Angular zones"}
                    </option>

                    <option value="maisons">
                      {lang === "fr" ? "Maisons" : "Houses"}
                    </option>

                    <option value="quadrants">
                      Quadrants
                    </option>

                    <option value="hemispheres">
                      {lang === "fr" ? "Hémisphères" : "Hemispheres"}
                    </option>

                    <option value="aspects">
                      Aspects
                    </option>
                  </select>

                  <div
                    style={{
                      marginTop: 14,
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    {txt.curveElement} :
                  </div>

                  <select
                    title={UI_TOOLTIPS[lang].curve_element}
                    value={curveElement}
                    onChange={(e) => setCurveElement(e.target.value)}
                    style={{
                      ...compactInputStyle,
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {curveElementOptions.map((item) => (
                      <option key={item} value={item}>
                        {translateCategory(item, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginBottom: 6,
                  display: "grid",
                  gridTemplateColumns: "115px 1fr",
                  columnGap: 8,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                  }}
                >
                  {txt.curveCustomTitle} :
                </div>

                <input
                  title={UI_TOOLTIPS[lang].chart_custom_title}
                  value={curveTitle}
                  onChange={(e) => setCurveTitle(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: "calc(100% - 16px)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <button
                  title={UI_TOOLTIPS[lang].curve_generate}
                  style={{
                    ...buttonStyle,
                    padding: "6px 14px",
                    backgroundColor: !curveFile ? "#e5e7eb" : "#f3f4f6",
                    cursor: !curveFile ? "not-allowed" : "pointer",
                  }}
                  disabled={!curveFile}
                  onClick={() => {
                    if (!curveFile) return;

                    const svg =
                      curveMode === "kde"
                        ? buildKdeCurveSvg(
                            curveRows,
                            curveCategory,
                            curveElement,
                            lang,
                            curveTitle
                          )
                        : curvePopulation === "hf"
                          ? buildGaussCurveSvgHF(
                              curveRows,
                              curveCategory,
                              curveElement,
                              lang,
                              curveTitle
                            )
                          : buildGaussCurveSvg(
                              curveRows,
                              curveCategory,
                              curveElement,
                              curvePopulation,
                              lang,
                              curveTitle
                            );

                    if (!svg) {
                      alert(
                        lang === "fr"
                          ? "Aucune donnée exploitable trouvée pour cet élément dans le CSV."
                          : "No usable data found for this item in the CSV."
                      );
                      return;
                    }

                    const dataUrl =
                      "data:image/svg+xml;charset=utf-8," +
                      encodeURIComponent(svg);

                    setCurveImage(dataUrl);

                    setCurveGeneratedOnce(true);
                  }}
                >
                  {txt.curveGenerate}
                </button>

                {curveImage && (
                  <button
                    title={UI_TOOLTIPS[lang].curve_export}
                    disabled={isTrialMode}
                    style={{
                      ...buttonStyle,
                      padding: "6px 14px",
                      backgroundColor: isTrialMode ? "#e5e7eb" : "#f3f4f6",
                      cursor: isTrialMode ? "not-allowed" : "pointer",
                    }}

                    onClick={async () => {
                      if (isTrialMode) return;

                      await exportSvgDataUrlAsPng(
                        curveImage,
                        "courbe_geoastro.png"
                      );
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <img
                        src="/icon_save.png"
                        alt=""
                        style={{
                          width: 15,
                          height: 15,
                        }}
                      />
                      {txt.curveExport}
                    </span>
                  </button>
                )}
              </div>
            </fieldset>
          </div>

          <div
            style={{
              flex: 1,
              margin: "0 28px 0",
              border: "1px solid #9ca3af",
              backgroundColor: "white",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!curveImage ? (
              <div
                style={{
                  color: "#9ca3af",
                  textAlign: "center",
                  fontStyle: "italic",
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                }}
              >
                {txt.curvePlaceholder}
              </div>
            ) : (
              <img
                src={curveImage}
                alt="Courbe"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            )}
          </div>

          <div
            style={{
              height: 22,
              textAlign: "center",
              fontSize: 12,
              color: "#6b7280",
              lineHeight: "22px",
            }}
          >
            © 2025 GéoAstro v1.0
          </div>
        </div>
      )}

      {activeTab === "analysis" && (
        <>

      <div
        style={{
          position: "relative",
          minHeight: 275,
          padding: "8px 10px 4px",
        }}
      >
<div
  className="stat-logo-block"
  style={{
    position: "absolute",
    left: 68,
    top: 36,
    width: 220,
    textAlign: "center",
  }}
>
          <div
            style={{
              fontSize: 42,
              color: "#d69b00",
              marginBottom: 10,
            }}
          >
            <img
              src="/logo.svg"
              alt="GéoAstro"
              style={{
                width: 115,
                height: "auto",
                display: "block",
                margin: "0 auto 8px",
              }}
            />
          </div>
          <div style={{ fontSize: 34, fontFamily: "Georgia, serif" }}>{txt.appName}</div>
          <div style={{ fontSize: 15, color: "#374151" }}>{txt.statisticalModule}</div>

        <HelpTooltip lang={lang} tooltipKey="quick_guide" position="right">
          <a
            href={
              lang === "fr"
                ? "/mode_emploi_geoastro.pdf"
                : "/user_guide_geoastro.pdf"
            }
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginTop: 26,
              fontSize: 13,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            📘 {lang === "fr"
              ? "Mode d’emploi — Guide rapide"
              : "User Guide — Quick Start"}
          </a>
        </HelpTooltip>
        </div>

        <div className="stat-analysis-controls" style={{ width: 620, margin: "0 auto" }}>
          <fieldset
            style={{
              maxWidth: 620,
              margin: "0 auto",
              border: "1px solid #cfd6df",
              backgroundColor: "#FAFAF7",
              padding: "9px 22px 8px",
            }}
          >
            <legend style={{ fontWeight: 700, color: "#374151", fontSize: 13 }}>
              <span style={{ fontSize: 14 }}>⚙️</span> {txt.parameters}
            </legend>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HelpTooltip lang={lang} tooltipKey="select_file">
                <label
                    style={{
                        ...buttonStyle,
                        backgroundColor: isTrialMode ? "#e5e7eb" : "#f3f4f6",
                        cursor: isTrialMode ? "not-allowed" : "pointer",
                    }}
                >
                    {txt.loadCsv}
                    <input
                        type="file"
                        accept=".csv"
                        disabled={isTrialMode}
                        style={{ display: "none" }}
                        onChange={async (e) => {
                            if (isTrialMode) return;
                      const f = e.target.files?.[0] ?? null;

                      if (!f) {
                        setFile(null);
                        setCalculationDone(false);
                        return;
                      }

                      const text = await readFileAsText(f);
                      const rows = parseCsvText(text);
                      const fileType = detectAnalysisCsvType(rows);

                      if (fileType === "invalid") {
                        alert(
                          lang === "fr"
                            ? "Ce fichier ne semble pas être une cohorte de naissance compatible avec l’onglet Analyse."
                            : "This file does not appear to be a birth cohort compatible with the Analysis tab."
                        );

                        setFile(null);
                        setCalculationDone(false);
                        e.target.value = "";
                        return;
                      }

                      setFile(f);
                      setCalculationDone(false);
                    }}
                  />
                </label>
              </HelpTooltip>

              <input
                value={file ? file.name : ""}
                readOnly
                style={{
                  width: 320,
                  padding: 7,
                  border: "1px solid #aeb7c2",
                  backgroundColor: "white",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 48,
                marginTop: 12,
                alignItems: "flex-start",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ marginBottom: 6 }}>Permutations:</div>
                <HelpTooltip lang={lang} tooltipKey="perm_1000" position="right">
                  <label>
                    <input
                      type="radio"
                      checked={permutations === 1000}
                      onChange={() => setPermutations(1000)}
                    />{" "}
                    1 000
                  </label>
                </HelpTooltip>
                <br />
                <HelpTooltip lang={lang} tooltipKey="perm_10000" position="right">
                  <label>
                    <input
                      type="radio"
                      checked={permutations === 10000}
                      onChange={() => setPermutations(10000)}
                    />{" "}
                    10 000
                  </label>
                </HelpTooltip>
              </div>

              <div>
                <div style={{ marginBottom: 6 }}>Langue / Language:</div>

                <HelpTooltip lang={lang} tooltipKey="lang_fr" position="right">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, lineHeight: "16px" }}>
                      <img
                        src="/flag_fr.png"
                        alt="FR"
                        style={{ width: 18, height: 12, objectFit: "cover" }}
                      />
                      <input
                        type="radio"
                        checked={lang === "fr"}
                        onChange={() => setLang("fr")}
                        style={{ margin: 0 }}
                      />
                      <span>FR</span>
                    </label>

                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, lineHeight: "16px" }}>
                      <img
                        src="/flag_gb.png"
                        alt="EN"
                        style={{ width: 18, height: 12, objectFit: "cover" }}
                      />
                      <input
                        type="radio"
                        checked={lang === "en"}
                        onChange={() => setLang("en")}
                        style={{ margin: 0 }}
                      />
                      <span>EN</span>
                    </label>
                  </div>
                </HelpTooltip>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                marginTop: 14,
              }}
            >
              <HelpTooltip lang={lang} tooltipKey="run_analysis">
<button
  disabled={!file || loading || isTrialMode}
  onClick={() => {
    if (isTrialMode) return;
    handleUpload();
  }}
  style={{
    ...buttonStyle,
    backgroundColor: !file || loading || isTrialMode ? "#e5e7eb" : "#f3f4f6",
    cursor: !file || loading || isTrialMode ? "not-allowed" : "pointer",
  }}
>
  {loading ? txt.loading : txt.launch}
</button>
              </HelpTooltip>

              {calculationDone && !loading && (
                <div
                  style={{
                    color: "#15803d",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  ✔ {lang === "fr" ? "Calcul terminé" : "Calculation completed"}
                </div>
              )}
            </div>

            {results.length > 0 && !loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 12,
                }}
              >
                <HelpTooltip lang={lang} tooltipKey="export_results">
                  <button
                    disabled={isTrialMode}
                    style={{
                      ...buttonStyle,
                      backgroundColor: isTrialMode ? "#e5e7eb" : "#f3f4f6",
                      cursor: isTrialMode ? "not-allowed" : "pointer",
                    }}
                    onClick={async () => {
                      if (isTrialMode) return;
                    const header = [
                      txt.category,
                      txt.sampleMean,
                      txt.distMean,
                      txt.std,
                      txt.zscore,
                      lang === "fr" ? "Proba empirique (surval)" : "Empirical prob. (overval.)",
                      lang === "fr" ? "Proba empirique (sous-val)" : "Empirical prob. (underval.)",
                      lang === "fr" ? "P-value (surval)" : "P-value (overval.)",
                      lang === "fr" ? "P-value (sous-val)" : "P-value (underval.)",
                    ].join(";");

                    const rows = results.map((row) =>
                      [
                        translateCategory(row.Catégorie, lang),
                        formatNum(row.effectif_reel),
                        formatNum(row.moyenne),
                        formatNum(row.ecart_type),
                        formatNum(row.z_score),
                        formatNum(row.p_gt),
                        formatNum(row.p_lt),
                        formatNum(row.pval_gt),
                        formatNum(row.pval_lt),
                      ].join(";")
                    );

                    await downloadTextFile(
                      "geoastro_results.csv",
                      [header, ...rows].join("\n")
                    );

                    if (includeKDE && (lastAnalysisData as any)?.kde_data) {
                      const rawKdeData = (lastAnalysisData as any).kde_data;

                      const statsByCategory = Object.fromEntries(
                        results.map((row) => [
                          row.Catégorie,
                          {
                            Categorie: translateCategory(row.Catégorie, lang),
                            effectif_reel: formatNum(row.effectif_reel),
                            moyenne: formatNum(row.moyenne),
                            ecart_type: formatNum(row.ecart_type),
                            z_score: formatNum(row.z_score),
                            p_gt: formatNum(row.p_gt),
                            p_lt: formatNum(row.p_lt),
                            pval_gt: formatNum(row.pval_gt),
                            pval_lt: formatNum(row.pval_lt),
                          },
                        ])
                      );

                      const kdeRowsArray = Object.entries(rawKdeData).map(
                        ([category, values]: [string, any]) => {
                          const statPart = statsByCategory[category] ?? {
                            Categorie: translateCategory(category, lang),
                            effectif_reel: "",
                            moyenne: "",
                            ecart_type: "",
                            z_score: "",
                            p_gt: "",
                            p_lt: "",
                            pval_gt: "",
                            pval_lt: "",
                          };

                          const kdePart = Array.isArray(values)
                            ? Object.fromEntries(
                                values.map((value: any, index: number) => [
                                  String(index),
                                  value,
                                ])
                              )
                            : values && typeof values === "object"
                              ? values
                              : { valeur: values };

                          return {
                            ...statPart,
                            ...kdePart,
                          };
                        }
                      );

                      if (kdeRowsArray.length > 0) {
                        const fixedKeys = [
                          "Categorie",
                          "effectif_reel",
                          "moyenne",
                          "ecart_type",
                          "z_score",
                          "p_gt",
                          "p_lt",
                          "pval_gt",
                          "pval_lt",
                        ];

                        const kdeKeys = [
                          ...fixedKeys,
                          ...Array.from(
                            new Set(
                              kdeRowsArray.flatMap((row: any) =>
                                Object.keys(row).filter(
                                  (key) => !fixedKeys.includes(key)
                                )
                              )
                            )
                          ),
                        ];

                        const kdeHeader = kdeKeys.join(";");

                        const kdeRows = kdeRowsArray.map((row: any) =>
                          kdeKeys.map((key) => row[key] ?? "").join(";")
                        );

                        await downloadTextFile(
                          "geoastro_results_KDE.csv",
                          [kdeHeader, ...kdeRows].join("\n")
                        );
                      }
                    }
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <img
                      src="/icon_save.png"
                      alt=""
                      style={{
                        width: 15,
                        height: 15,
                      }}
                    />
                    {lang === "fr"
                      ? "Exporter résultats CSV"
                      : "Export CSV results"}
                  </span>
                </button>
                </HelpTooltip>

                <HelpTooltip lang={lang} tooltipKey="include_kde" position="right">
                  <label
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      cursor: isTrialMode ? "not-allowed" : "pointer",
                      opacity: isTrialMode ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={includeKDE}
                      disabled={isTrialMode}
                      onChange={(e) => setIncludeKDE(e.target.checked)}
                    />

                    {lang === "fr"
                      ? "Inclure fichier KDE"
                      : "Include KDE file"}
                  </label>
                </HelpTooltip>
              </div>
            )}

            {loading && (
              <div
                style={{
                  margin: "9px auto 0",
                  width: 260,
                  height: 16,
                  border: "1px solid #9ca3af",
                  backgroundColor: "#e5e7eb",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: "#22c55e",
                    transition: "width 0.25s linear",
                  }}
                />
              </div>
            )}
          </fieldset>
        </div>
      </div>

      <div
        style={{
          padding: "8px 8px 6px",
          width: "100%",
          maxWidth: 1870,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >

        {results.length === 0 && (
          <div
            style={{
              width: "100%",
              margin: "0 auto 0",
              boxSizing: "border-box",
              height: "calc(100vh - 365px)",
              minHeight: 500,
              border: "1px solid #9ca3af",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8b95a5",
              fontStyle: "italic",
              textAlign: "center",
              fontSize: 13,
              lineHeight: 1.35,
            }}
          >

            {loading ? (
              lang === "fr" ? "Veuillez patienter..." : "Please wait..."
            ) : (
              <>
                {txt.noResults}
                <br />
                {txt.noResults2}
              </>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div
            style={{
              overflowX: "auto",
              maxHeight: "calc(100vh - 370px)",
              overflowY: "auto",
              border: "1px solid #9ca3af",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 1500,
                fontSize: 14,
                borderCollapse: "collapse",
                backgroundColor: "white",
              }}
            >
              <thead style={{ backgroundColor: "#eef0f4", color: "#111827" }}>
                <tr>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_category" position="bottom" safeLeft>
                      <span>{txt.category}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_sample_mean" position="bottom">
                      <span>{txt.sampleMean}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_distribution_mean" position="bottom">
                      <span>{txt.distMean}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_std" position="bottom">
                      <span>{txt.std}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_zscore" position="bottom">
                      <span>{txt.zscore}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_empirical_over" position="bottom">
                      <span>{lang === "fr" ? "Proba empirique (surval)" : "Empirical prob. (overval.)"}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_empirical_under" position="bottom">
                      <span>{lang === "fr" ? "Proba empirique (sous-val)" : "Empirical prob. (underval.)"}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_pvalue_over" position="bottom">
                      <span>{lang === "fr" ? "P-value (surval)" : "P-value (overval.)"}</span>
                    </HelpTooltip>
                  </th>
                  <th style={thStyle}>
                    <HelpTooltip lang={lang} tooltipKey="col_pvalue_under" position="bottom" safeRight>
                      <span>{lang === "fr" ? "P-value (sous-val)" : "P-value (underval.)"}</span>
                    </HelpTooltip>
                  </th>
                </tr>
              </thead>

              <tbody>
                {results.map((row, index) => {
                  const cat = row.Catégorie;

                  const showGroup =
                    cat.includes("Soleil") ||
                    cat.includes("Représentation extensive") ||
                    cat.includes("Bélier") ||
                    cat.includes("Force d'excitation") ||
                    cat.includes("Ascendant") ||
                    cat === "Maison I" ||
                    cat.includes("Quadrant oriental diurne") ||
                    cat.includes("Hémisphère oriental") ||
                    cat.includes("Conjonction");

                  let groupTitle = "";

                  if (cat.includes("Soleil")) {
                    groupTitle =
                      lang === "fr"
                        ? "Planètes astrologiques"
                        : "Astrological planets";
                  }

                  else if (cat.includes("Représentation extensive")) {
                    groupTitle =
                      lang === "fr"
                        ? "Familles planétaires RET"
                        : "RET planetary families";
                  }

                  else if (cat.includes("Bélier")) {
                    groupTitle =
                      lang === "fr"
                        ? "Signes zodiacaux"
                        : "Zodiac signs";
                  }

                  else if (cat.includes("Force d'excitation")) {
                    groupTitle =
                      lang === "fr"
                        ? "Familles zodiacales"
                        : "Zodiac families";
                  }

                  else if (cat.includes("Ascendant")) {
                    groupTitle =
                      lang === "fr"
                        ? "Zones d’angularité"
                        : "Angularity zones";
                  }

                  else if (cat === "Maison I") {
                    groupTitle =
                      lang === "fr"
                        ? "Maisons astrologiques"
                        : "Astrological houses";
                  }

                  else if (cat.includes("Quadrant oriental diurne")) {
                    groupTitle =
                      lang === "fr"
                        ? "Quadrants"
                        : "Quadrants";
                  }

                  else if (cat.includes("Hémisphère oriental")) {
                    groupTitle =
                      lang === "fr"
                        ? "Hémisphères"
                        : "Hemispheres";
                  }

                  else if (cat.includes("Conjonction")) {
                    groupTitle =
                      lang === "fr"
                        ? "Aspects planétaires"
                        : "Planetary aspects";
                  }

                  return (
                    <React.Fragment key={`${row.Catégorie}-${index}`}>
                      {showGroup && (
                        <>

                          <tr>
                            <td
                              colSpan={9}
                              style={{
                                backgroundColor: "#e3e5ea",
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderTop: "1px solid #d6d9de",
                                borderBottom: "1px solid #d6d9de",
                                borderRight: "1px solid #d6d9de",
                                fontSize: 13,
                                textAlign: "left",
                              }}
                            >
                              {groupTitle}
                            </td>
                          </tr>
                        </>
                      )}

                      <tr
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#f3f4f6" : "#ffffff",
                        }}
                      >

                        <td style={{ ...tdStyle, textAlign: "left", paddingLeft: 8 }}>
                          {translateCategory(row.Catégorie, lang)}
                        </td>

                        <td style={tdStyle}>
                          {formatNum(row.effectif_reel)}
                        </td>

                        <td style={tdStyle}>
                          {formatNum(row.moyenne)}
                        </td>

                        <td style={tdStyle}>
                          {formatNum(row.ecart_type)}
                        </td>

                        <td style={tdStyle}>
                          {formatNum(row.z_score)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: row.p_gt >= 0.95 ? 700 : 400,
                          }}
                        >
                          {formatNum(row.p_gt)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: row.p_lt >= 0.95 ? 700 : 400,
                          }}
                        >
                          {formatNum(row.p_lt)}
                        </td>

                        <td style={tdStyle}>
                          {formatNum(row.pval_gt)}
                        </td>

                        <td style={tdStyle}>
                          {formatNum(row.pval_lt)}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: 13,
          padding: "0px 0 1px",
          lineHeight: "14px",
        }}
      >
        © 2025 GéoAstro v1.0
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 3,
  padding: "6px 8px",
  borderRight: "1px solid #d6d9de",
  borderBottom: "1px solid #b8bec7",
  backgroundColor: "#eef0f4",
  fontSize: 13,
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "3px 8px",
  whiteSpace: "nowrap",
  textAlign: "center",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #d6d9de",
  fontSize: 13,
};

const progressStyle = document.createElement("style");
progressStyle.innerHTML = `
@keyframes geoastro-progress {
  0% {
    width: 8%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 8%;
  }
}
`;
document.head.appendChild(progressStyle);

export default App;
