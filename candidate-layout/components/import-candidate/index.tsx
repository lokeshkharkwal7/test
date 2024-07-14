import { ChangeEvent, useState } from "react";
import ImportFile from "../../../../components/mui/import-candidate";
import useValidateImport from "../../common/useValidateImport";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import useSnackbar from "../../../../hooks/useSnackbar";
import { ICandidate, IErrorResponse } from "../../../../interfaces";
import ImportFileError from "../../../../components/mui/import-candidate/erros";
import { CandidateService } from "../../../../services";

interface IState {
    fileName: string;
    data: ICandidate[];
    errorMessage: ICandidate[];
    showError: boolean;
}

interface IValidate {
    data: ICandidate[];
    errorMessage: ICandidate[]
}

interface outletProps {
    reFetch: () => void
}

const ImportCandidate = () => {
    const { typeOfLead } = useParams();
    const navigate = useNavigate();
    const outlet = useOutletContext<outletProps>();
    const { addCandidates } = CandidateService();
    const { snackbar } = useSnackbar();
    const { validateInternsUpload, validateFulltimeUpload } = useValidateImport();
    const [state, setState] = useState<IState>({
        fileName: "",
        data: [],
        showError: false,
        errorMessage: []
    });

    const closeImport = () => {
        navigate(-1);
    };

    const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const formData = new FormData();
        const fileType = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];

        const selectedFile = event.target.files ? event.target.files[0] : false;

        if (selectedFile && fileType.includes(selectedFile.type)) {
            formData.append("file", selectedFile);
            const reader = new FileReader();
            reader.readAsArrayBuffer(selectedFile);
            reader.onload = async (e) => {
                if (e.target) {
                    const data = e.target.result;
                    const readedData = XLSX.read(data, { type: "binary" });
                    const wsname = readedData.SheetNames[0];
                    const ws = readedData.Sheets[wsname];
                    let dataParse = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    dataParse = dataParse?.slice(1);

                    const employeeData =
                        typeOfLead === "intern"
                            ? await validateInternsUpload(dataParse, typeOfLead ? typeOfLead : "intern") as IValidate
                            : await validateFulltimeUpload(dataParse, typeOfLead ? typeOfLead : "full-time") as IValidate;

                    setState(prev => ({
                        ...prev,
                        ...employeeData,
                        fileName: selectedFile.name
                    }));
                }

            };
        } else {
            snackbar("Upload excel or xls file", "warning");
        }
    };

    const getDownloadInfo = () => {
        if (typeOfLead === "intern") {
            return {
                url: "/intern_candidate.xlsx",
                name: "ATS | Candidate Import | Intern",
            };
        } else if (typeOfLead === "full-time") {
            return {
                url: "/fulltime_candidate.xlsx",
                name: "ATS | Candidate Import | Full Time",
            };
        } else if (typeOfLead === "consultant") {
            return {
                url: "/consultant_candidate.xlsx",
                name: "ATS | Candidate Import | Consultant",
            };
        }

        return {
            url: "",
            name: "",
        };
    };

    const onSubmit = async () => {
        try {
            if (state.data.length) {
                const candidates = await addCandidates(state.data);
                outlet.reFetch();
                snackbar(candidates.message, "info");
            }
        } catch (error) {
            const err = error as IErrorResponse;
            snackbar(err.data.message, "warning");
        }


        if (state.errorMessage.length) {
            setState(prev => ({
                ...prev,
                showError: true
            }));
        } else {
            closeErrorDialog();
        }
    };

    const closeErrorDialog = () => {
        setState(prev => ({
            ...prev,
            fileName: "",
            data: [],
            showError: false,
            errorMessage: []
        }));

        navigate(-1);
    };

    return (
        <>
            <ImportFile
                isOpen={true}
                onClose={closeImport}
                download={getDownloadInfo()}
                onUpload={onUpload}
                onsubmit={onSubmit}
                fileName={state.fileName}
                title="Before you start upload, please make sure:"
                content={[
                    "Download the sample excel file.",
                    "From Jobs section, copy the Job id and paste it accordingly.",
                    "Read all the fields in the 1st row and do not change the text.",
                    "Start uploading the data from 2nd row and onwards.",
                    "In each row, there will be data for one candidate.",
                    "All variants are mapped to their field by field title.",
                    "Mandatory fields are Name, Contact Number and Job Title and Status.",
                    "Once sheet is prepared, upload it.",
                    "Now sit back and relax!",
                ]}
            />

            <ImportFileError
                title="Excel file Errors"
                isOpen={state.showError}
                onClose={closeErrorDialog}
                errorMessage={state.errorMessage}
            />
        </>
    );
};

export default ImportCandidate; 