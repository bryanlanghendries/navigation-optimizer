import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { apiGetFormByExternalUuid, apiPostForm } from "../apiForms";
import { useEffect, useState } from "react";
import { Model, Survey } from "survey-react-ui";
import "survey-core/defaultV2.css";
import {
  ButtonOutlinedCancel,
  CONST_PAGES_WEBEDI,
  PageMode,
  PageWrap,
} from "lib";
import { useAtomNotification } from "lib/src/atoms/AtomNotification";
import { useFormView } from "./UseFormView";
import { LightTheme } from "./themes/lightmode";
import { DarkTheme } from "./themes/darkmode";
import { FunctionFactory } from "survey-core";
//import { generateInvoice } from "./generateInvoice";

function getInfo(this: any, params: any[]): any {
  const qName = params[2];
  const attributeName = params[1];
  const question = this.survey.getQuestionByName(qName);

  if (question && question.selectedItem) {
    console.log(question.selectedItem.originalItem);
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

//
interface FormViewProps {
  pageMode: PageMode;
}

//
export const FormView = ({ pageMode }: FormViewProps) => {
  const { configurationId: externalUuid } = useParams();
  const [model, setModel] = useState<Model>(new Model());

  const { notifySuccess, notifyError } = useAtomNotification();

  const navigate = useNavigate();

  const theme = useTheme();

  model.applyTheme(theme.palette.mode === "dark" ? DarkTheme : LightTheme);

  //
  const { crumbs } = useFormView({ pageMode });

  function saveSurveyData(survey: Model) {
    const data = survey.data;
    data.pageNo = survey.currentPageNo;
    if (externalUuid)
      window.sessionStorage.setItem(externalUuid, JSON.stringify(data));
  }

  //
  useEffect(() => {
    (async () => {
      try {
        const res = await apiGetFormByExternalUuid(externalUuid);
        const newModel = new Model(res.data.formData);
        newModel.showCompletedPage = false;
        newModel.onValueChanged.add(saveSurveyData);
        newModel.onCurrentPageChanged.add(saveSurveyData);
        newModel.addNavigationItem({
          id: "sv-nav-clear-page",
          title: "Clear Form",
          action: () => {
            newModel.clear();
            if (externalUuid) sessionStorage.removeItem(externalUuid);
          },
          css: "nav-button",
          innerCss: "sd-btn nav-input",
        });
        let localData;
        if (externalUuid)
          localData = window.sessionStorage.getItem(externalUuid);
        if (localData) newModel.data = JSON.parse(localData);
        setModel(newModel);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [externalUuid]);

  const getAnswer = (element: any, response: any) => {
    const answer =
      response[element.name] !== undefined
        ? response[element.name]
        : element.description;

    if (answer === undefined || answer === null) {
      return null;
    }
    return answer;
  };

  const extractQuestions = (elements: any[], response: any): any[] => {
    return elements.map((element: any) => {
      const answer = getAnswer(element, response);

      if (element.type === "panel" || element.type === "paneldynamic") {
        if (Array.isArray(element.elements)) {
          return {
            ...element,
            elements: extractQuestions(element.elements, response),
          };
        }
      }

      return {
        ...element,
        answer: answer,
      };
    });
  };

  const mapElements = (page: any, response: any): any => {
    const mappedPage = { ...page };

    mappedPage.elements = mappedPage.elements.map((element: any) => {
      const answer = getAnswer(element, response);

      if (element.type === "panel" || element.type === "paneldynamic") {
        if (Array.isArray(element.elements)) {
          return {
            ...element,
            elements: extractQuestions(element.elements, response),
          };
        }
      }

      return {
        ...element,
        answer: answer,
      };
    });

    return mappedPage;
  };

  const handleError = (error: any) => {
    console.error("error: onFormSubmit", error);
    notifyError(
      <Stack>
        <Typography>Failed to complete survey</Typography>
        <Box>{`${
          error.response?.data?.details || error.response?.data?.message
        }`}</Box>
      </Stack>
    );
  };

  const handleSuccess = () => {
    notifySuccess(<Typography>Successfully completed survey</Typography>);
  };

  const submitForm = async (dtoMontovaRequest: any, externalUuid: string) => {
    try {
      sessionStorage.removeItem(externalUuid);
      await apiPostForm(dtoMontovaRequest, externalUuid);
    } catch (error) {
      throw error;
    }
  };

  const onComplete = async (form: any) => {
    const json = form.jsonObj;
    const response = form.valuesHash;

    const allPagesWithAnswers = json?.pages.map((page: any) =>
      mapElements(page, response)
    );

    const dtoMontovaRequest = {
      data: {
        pages: allPagesWithAnswers,
      },
    };

    try {
      //generateInvoice(dtoMontovaRequest);
      await submitForm(dtoMontovaRequest, externalUuid as string);
      handleSuccess();
    } catch (error: any) {
      handleError(error);
    }
    navigate(CONST_PAGES_WEBEDI.forms.overview.routepath);
  };

  return (
    <PageWrap
      crumbs={crumbs}
      footer={{
        right: (
          <Stack direction="row" gap={1} pr={1}>
            <ButtonOutlinedCancel
              onClick={() =>
                navigate(CONST_PAGES_WEBEDI.forms.overview.routepath)
              }
            />
          </Stack>
        ),
      }}
    >
      <Survey model={model} onComplete={onComplete} />
    </PageWrap>
  );
};
