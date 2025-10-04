export interface Article {
  article: {
    id: string;
    url: string;
    title: string;
    authors: string[];
    journal: string;
    year: string;
    keywords: string[];
    funding: string[];
    abstract: string;
    sections: {
      introduction: string;
      methods: string;
      results: string;
      discussion: string;
    };
    experimental_factors: {
      organism: string;
      organism_raw: string;
      cell_type: string;
      cell_type_raw: string;
      tissue: string;
      tissue_raw: string;
      tissue_list: string[];
      tissue_detail: Array<{
        text: string;
        normalized: string;
        ontology: {
          id: string;
          label: string;
        };
      }>;
      treatment: string;
      treatment_raw: string;
      treatment_list: string[];
      treatment_detail: Array<{
        text: string;
        normalized: string;
        ontology: {
          id: string;
          label: string;
        };
      }>;
      duration: string;
      duration_raw: string;
      duration_detail: {
        raw: string;
        normalized: string;
        range: {
          min: string;
          max: string;
        };
      };
      sex: string;
      sex_raw: string;
      sex_list: string[];
      genotype: string;
      genotype_raw: string;
      genotype_detail: {
        text: string;
        normalized: string;
      };
      strain: string;
      strain_raw: string;
      line_name: string;
      line_name_raw: string;
      model_type: string;
      model_type_raw: string;
      age_at_sampling: string;
      age_at_sampling_detail: {
        raw: string;
        normalized: string;
        range: {
          min: string;
          max: string;
        };
      };
      cell_type_detail: {
        text: string;
        normalized: string;
        ontology: {
          id: string;
          label: string;
        };
      };
    };
    technologies: string[];
    technologies_detail: Array<{
      text: string;
      normalized: string;
    }>;
    insights_summary: string;
    acknowledgments: string;
    references: string[];
  };
}