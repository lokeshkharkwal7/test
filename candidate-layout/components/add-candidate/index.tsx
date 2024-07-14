import { useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { CandidateService } from "../../../../services";
import { capitalize, displayName, getGraduationYears } from "../../../../utilities/helper";
import { ChangeEvent, useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ICandidateField, IJob, ICandidate, IUser, ICpdDrive, IErrorResponse } from "../../../../interfaces";
import { AddCandidateValidation, AddFullTimeAndConsultantCandidateValidation } from "../../../../validations";
import {
    Box, Grid, MenuItem, TextField, SelectChangeEvent,
    Link, Button, InputLabel
} from "@mui/material";
import HttpService from "../../../../services/http";
import Select from "../../../../components/mui/select";
import useSnackbar from "../../../../hooks/useSnackbar";
import CustomDialog from "../../../../components/mui/dialog";
import MobileNumber from "../../../../components/mui/mobile-number";
import CustomLabel from "../../../../components/mui/custom-label";
import SearchSelect from "../../../../components/mui/search-select";
interface ICollege {
    _id: string;
    name: string;
}

interface outletProps {
    reFetch: () => void
}

const AddCandidate = () => {
    const navigate = useNavigate();
    const { typeOfLead } = useParams();
    const { snackbar } = useSnackbar();
    const { httpFormRequest } = HttpService();
    const { addCandidate } = CandidateService();
    const outlet = useOutletContext<outletProps>();
    const users = useSelector<{ user: { list: IUser[] } }, IUser[]>(state => state.user.list);
    let [...jobs] = useSelector<{ job: { list: IJob[] } }, IJob[]>(state => state.job.list) || [];
    jobs = jobs.filter(job => job.type === typeOfLead);
    const drives = useSelector<{ cpdDrive: { list: ICpdDrive[] } }, ICpdDrive[]>(state => state.cpdDrive.list);
    const [...colleges] = useSelector<{ college: { list: ICollege[] } }, ICollege[]>(state => state.college.list) || [];
    const currentYear = new Date().getFullYear();
    const { handleSubmit, control, setValue, trigger, getValues, watch, formState: { errors } } = useForm<ICandidate>({
        resolver: joiResolver(typeOfLead === "intern" ? AddCandidateValidation: AddFullTimeAndConsultantCandidateValidation),
        defaultValues: {
            name: "",
            email: "",
            collegeName: "",
            comments: "",
            reference: "",
            source: "manual",
        }
    });

    const selectType = watch("reference");

    const [state, setState] = useState({
        mobileNumber: {
            country: "INDIA",
            dialCode: "+91",
            iso2: "IN"
        },
        mobileNumberSecondary: {
            country: "INDIA",
            dialCode: "+91",
            iso2: "IN"
        },
    });

    const onNumberChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        const data = value.split(":");

        setState(prev => ({
            ...prev,
            [name]: {
                country: data[0],
                iso2: data[1],
                dialCode: data[2]
            }
        }));
    };

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "_cpd") {
                const drive = drives.find(drive => drive.cpdId === value._cpd);
                setValue("collegeName", drive?.collegeId.name);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, drives]);

    const uploadFile = async (e: ChangeEvent<HTMLInputElement>, type: string) => {
        try {
            const uploaded = await httpFormRequest<{ data: string }>(
                e.target.files,
                e.target.files ? e.target.files[0].name : "",
                ["doc", "docx", "pdf", "png", "jpeg", "jpg"],
                10
            );
            const name = type === "resumes" || type === "coderByte" || type === "contentAssessment" || type === "graphicAssessment" ? type : "resumes";
            setValue(name, uploaded.data.split("uploads")[1]);
        } catch (error) {
            console.log("error in candidate detail upload", error);
        }

    };

    const onSubmit = async (data: ICandidate) => {
        try {
            let reference: {
                type: string;
                _user?: string;
                name?: string;
            } = {
                type: "internal",
            };

            if (data.reference === "others") {
                reference = {
                    type: "external",
                    name: data.others,
                };
            } else {
                reference._user = data.reference || undefined;
            }

            const payload = {
                ...data,
                mobileNumber: {
                    ...state.mobileNumber,
                    number: data.mobileNumber,
                },
                mobileNumberSecondary: {
                    ...state.mobileNumberSecondary,
                    number: data.mobileNumberSecondary,
                },
                reference: reference,
                typeOfLead: typeOfLead ? typeOfLead.toUpperCase() : undefined,
            };
            delete payload.others;
            const add = await addCandidate(payload);
            snackbar(add.message, "info");
            navigate("/candidates/" + typeOfLead);
            outlet?.reFetch && outlet.reFetch();
        } catch (error) {
            const err = error as IErrorResponse;
            snackbar(err.data.message, "warning");
            console.log(error);
        }
    };

    const fields: ICandidateField[] = [
        {
            label: "Job Title",
            name: "jobId",
            type: "select",
            displayFieldKey: "title",
            storeFieldKey: "_id",
            options: jobs,
            width: 12,
            required: true
        },
        {
            label: "Name",
            name: "name",
            type: "input",
            placeholder: "Type candidate name here",
            required: true
        },
        {
            label: "Email Address",
            name: "email",
            type: "input",
            placeholder: "Type candidate email here",
            required: true
        },
        {
            label: "Contact Number (Primary)",
            name: "mobileNumber",
            numberState: "mobileNumber",
            type: "mobile-number",
            required: true
        },
        {
            label: "Contact Number (Secondary)",
            name: "mobileNumberSecondary",
            numberState: "mobileNumberSecondary",
            type: "mobile-number",
        },
        {
            label: "CPD ID",
            name: "_cpd",
            type: "select",
            options: drives,
            displayFieldKey: "cpdId",
            storeFieldKey: "cpdId"
        },
        {
            label: "College",
            name: "collegeName",
            type: "select",
            options: colleges,
            displayFieldKey: "name",
            storeFieldKey: "name",
            capitalize: true
        },
        {
            label: "Graduation Year",
            name: "graduationYear",
            type: "select",
            options: getGraduationYears(currentYear),
            displayFieldKey: "value",
            storeFieldKey: "value",
            required: true
        },
        {
            label: "Source",
            name: "source",
            type: "select",
            options: [
                {key: "manual", value: "Manual"},
                {key: "internshala", value: "Internshala"},
                {key: "naukri", value: "Naukri"},
                {key: "indeed", value: "Indeed"},
            ],
            displayFieldKey: "value",
            storeFieldKey: "key"
        },
        {
            label: "Reference",
            name: "reference",
            type: "select",
            children: [
                ...users.map((user, i) => <MenuItem key={i} value={user._id}>{`${capitalize(displayName(user))}`}</MenuItem>),
                <MenuItem key={"others"} value="others">Others</MenuItem>,
            ],
            options: [
                ...users,
                { _id:"others", name:"Other" }
            ],
            displayFieldKey: "name",
            storeFieldKey: "_id",
            displayUserName: true
        },
        {
            label: "Other Reference",
            name: "others",
            type: "input",
        },
        {
            label: "Note",
            name: "comments",
            type: "multiline",
            placeholder: "Type note here",
            width: 12
        },
    ];

    const DocumentFields: ICandidateField[] = [
        {
            label: "Resume",
            name: "resumes",
            type: "file",
        },
    ];

    const filteredFields = fields.filter((field) => {
        if (selectType === "others") {
            return field.name === "jobId" || field.name === "name" || field.name === "email" ||
                field.name === "mobileNumber" || field.name === "mobileNumberSecondary" || field.name === "_cpd" || field.name === "collegeName"
                || field.name === "graduationYear" || field.name === "source" || field.name === "reference" || field.name === "others" || field.name === "comments";
        } else {
            return field.name === "jobId" || field.name === "name" || field.name === "email" ||
                field.name === "mobileNumber" || field.name === "mobileNumberSecondary" || field.name === "_cpd" || field.name === "collegeName"
                || field.name === "graduationYear" || field.name === "source" || field.name === "reference" || field.name === "comments";
        }
    });

    return (
        <Box>
            <CustomDialog
                isOpen={true}
                onClose={() => navigate("/candidates/" + typeOfLead)}
                title="Add Candidate"
                onSubmit={handleSubmit(onSubmit)}
            >
                <Grid container spacing={4}>
                    {
                        filteredFields.map(field => {
                            if (
                                (field.name === "_cpd" ||
                                    field.name === "collegeName" ||
                                    field.name === "graduationYear") &&
                                typeOfLead !== "intern"
                            ) {
                                return null;
                            }
                            if (field.type === "input") {
                                return (<Grid key={field.label} item xs={12} md={6}>
                                    <Controller
                                        control={control}
                                        name={field.name}
                                        render={(prop) => <TextField
                                            label={<CustomLabel label={field.label} required={field?.required} />}
                                            className="disable-text"
                                            variant="outlined"
                                            size="small"
                                            placeholder={field.placeholder}
                                            error={errors[field.name] ? true : false}
                                            helperText={errors[field.name]?.message}
                                            {...prop.field}
                                        />}
                                    />
                                </Grid>
                                );
                            }
                            else if (field.label === "Job Title*") {
                                return (<Grid key={field.label} item xs={12} md={field.width ? field.width : 12}>
                                    <Select
                                        control={control}
                                        name={field.name}
                                        label={<CustomLabel label={field.label} required={field?.required} />}
                                        size="small"
                                        variant="outlined"
                                        error={errors[field.name] ? true : false}
                                        helperText={errors[field.name]?.message}
                                    >
                                        {field.children}
                                    </Select>
                                </Grid>
                                );
                            }
                            else if (field.type === "multiline") {
                                return (<Grid key={field.label} item xs={12} md={field.width ? field.width : 12}>
                                    <Controller
                                        control={control}
                                        name={field.name}
                                        render={(prop) => <TextField
                                            label={<CustomLabel label={field.label} required={field?.required} />}
                                            className="disable-text"
                                            variant="outlined"
                                            size="small"
                                            placeholder={field.placeholder}
                                            error={errors[field.name] ? true : false}
                                            helperText={errors[field.name]?.message}
                                            multiline
                                            minRows={2}
                                            {...prop.field}
                                        />}
                                    />
                                </Grid>
                                );
                            }
                            else if (field.type === "mobile-number") {
                                const numberState = field.numberState ? field.numberState : "mobileNumber";
                                return <Grid key={field.label} item xs={12} md={6}>
                                    <Controller
                                        control={control}
                                        name={field.name}
                                        render={(prop) => <MobileNumber
                                            key={field.label}
                                            className="disable-text"
                                            NumberFieldLabel={<CustomLabel label={field.label} required={field?.required} />}
                                            dialCodeValue={`${state[numberState].country}:${state[numberState].iso2}:${state[numberState].dialCode}`}
                                            dialCodeName={field.name}
                                            onChange={onNumberChange}
                                            error={errors[field.name] ? true : false}
                                            helperText={errors[field.name]?.message}
                                            other={prop.field}
                                        />}
                                    />
                                </Grid>;
                            } else {
                                return (<Grid key={field.label} item xs={12} md={6}>
                                    <SearchSelect
                                        name={field.name}
                                        label={<CustomLabel label={field.label} required={field?.required} />}
                                        error={errors[field.name] ? true : false}
                                        helperText={errors[field.name]?.message}
                                        options={field.options}
                                        displayFieldKey={field.displayFieldKey ? field.displayFieldKey : ""}
                                        storeFieldKey={field.storeFieldKey ? field.storeFieldKey : ""}
                                        displayUserName={field.displayUserName}
                                        capitalize={field.capitalize}
                                        trigger={trigger}
                                        setValue={setValue}
                                        getValues={getValues}
                                    />
                                </Grid>
                                );
                            }
                        })
                    }
                    {
                        DocumentFields.map(field => {
                            const hasValue = getValues(field.name);
                            const shouldShowLabel = hasValue;

                            return (
                                <Grid key={field.label} item xs={12} md={6}>
                                    <div>
                                        <div style={{ color: "rgb(118, 118, 118)", marginBottom: "3px" }}>
                                            {shouldShowLabel &&
                                                <label>{field.label}</label>
                                            }
                                        </div>
                                        <Grid container spacing={2}>
                                            {hasValue && (
                                                <Grid item xs>
                                                    <Link href={String(process.env.REACT_APP_S3_BASE_URL) + getValues(field.name)?.toString()} target="_blank" underline="none" color="inherit">
                                                        <Button variant="outlined" fullWidth>
                                                            Preview
                                                        </Button>
                                                    </Link>
                                                </Grid>
                                            )}
                                            {!hasValue && (
                                                <Grid item xs>
                                                    <InputLabel id={`upload-${field.name}`}>
                                                        <Button component="label" fullWidth>
                                                            Upload {field.label}
                                                            <input hidden type="file" id={`upload-${field.name}`} onChange={e => uploadFile(e, field.name)} accept="application/pdf, image/png, image/jpeg, .doc, .docx" />
                                                        </Button>
                                                    </InputLabel>
                                                </Grid>
                                            )}
                                            {hasValue && (
                                                <Grid item xs>
                                                    <Button onClick={() => {
                                                        setValue(field.name, undefined);
                                                        trigger(field.name);
                                                    }} variant="outlined" color="error" fullWidth>
                                                        Delete
                                                    </Button>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </div>
                                </Grid>
                            );
                        })
                    }
                </Grid>
            </CustomDialog>
        </Box>
    );
};

export default AddCandidate;