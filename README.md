import { useContext, useEffect, useRef, useState } from "react";
import { ContextDetailsForm } from "../contextDetailsForm.ts";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import "survey-core/defaultV2.css";
import "survey-creator-core/survey-creator-core.min.css";
import { Serializer, FunctionFactory } from "survey-core";
import { v4 as uuidv4 } from "uuid";

function getInfo(this: any, params: any[]): any {
  const qName = params[2];
  const attributeName = params[1];
  const question = this.survey.getQuestionByName(qName);

  if (question && question.selectedItem) {
    const sourceItem = question.selectedItem.originalItem;
    return sourceItem ? sourceItem[attributeName] : null;
  }

  return null;
}

function sumCalc(params: any[]) {
  const subArray = params[0];
  const field = params[1];
  if (!subArray) return 0;

  return subArray.reduce((totalSum: number, element: { [x: string]: any }) => {
    const fieldValue = element?.[field];
    return fieldValue ? totalSum + parseFloat(fieldValue) : totalSum;
  }, 0);
}

FunctionFactory.Instance.register("sumCalc", sumCalc);

FunctionFactory.Instance.register("getInfo", getInfo);

export const SectionFormCreator = () => {
  const {
    utilDetailsForm,
    utilApiGetFormById: { data, utilQuery },
    utilUseIsPending,
  } = useContext(ContextDetailsForm);

  const creatorRef = useRef<SurveyCreator | null>(null);
  const [isCreatorReady, setIsCreatorReady] = useState(false);

  // Initialize the Survey Creator only once
  useEffect(() => {
    if (!creatorRef.current) {
      initializeSurveyCreator();
    }
  }, []);

  // Update the Survey Creator with the fetched data and set the state
  useEffect(() => {
    if (data && !utilQuery.isFetching && creatorRef.current) {
      creatorRef.current.JSON = data.formData;
      creatorRef.current.saveSurveyFunc = saveSurvey;
      creatorRef.current.isAutoSave = true;
      setIsCreatorReady(true);
    }
  }, [data, utilQuery.isFetching]);

  // Function to initialize the Survey Creator
  const initializeSurveyCreator = () => {
    const creator = new SurveyCreator();
    creatorRef.current = creator;

    // Add UUID property to questions
    Serializer.addProperty("question", { name: "uuid", category: "general" });
    Serializer.findProperty("question", "uuid").readOnly = true;
    Serializer.findProperty("question", "uuid").visible = false;

    // Make sure that dropdowns always attach the original item
    Serializer.addProperty("dropdown", {
      name: "attachOriginalItems",
      category: "general",
      default: true,
    });

    // Generate UUID for new questions
    creator.onQuestionAdded.add((_sender, options) => {
      const question = options.question;
      question.uuid = uuidv4();
    });
  };

  // Save the survey
  const saveSurvey = (saveNo: any, callback: any) => {
    utilUseIsPending.startPending();

    if (creatorRef.current) {
      const surveyJSON = creatorRef.current.getSurveyJSON();
      utilDetailsForm.utilFormDetailsForm.setValue("formData", surveyJSON);
      callback(saveNo, true);
    }

    utilUseIsPending.stopPending();
  };

  if (!isCreatorReady) {
    return null;
  }

  return (
    <>
      <SurveyCreatorComponent creator={creatorRef.current!} />
    </>
  );
};
