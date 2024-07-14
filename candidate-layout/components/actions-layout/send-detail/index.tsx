import { Box, Button, Chip, Divider, FormControl, FormControlLabel, FormHelperText, FormLabel, Grid, Switch, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { ICandidateSendDetailField, ICandidateSendDetail, ITemplate, ICandidate, IErrorResponse, IUser } from "../../../../../interfaces";
import { FC, KeyboardEvent, useEffect, useState } from "react";
import TinyEditor from "../../../../../components/text-editor";
import { joiResolver } from "@hookform/resolvers/joi";
import { candidateSendDetailValidation } from "../../../../../validations";
import { CandidateService } from "../../../../../services";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useSnackbar from "../../../../../hooks/useSnackbar";
import { validateEmail } from "../../../../../validations/shared";
import { useSelector } from "react-redux";
import { capitalize } from "../../../../../utilities/helper";
import { replaceHtmlKeyword } from "../../../../../utilities/helper";
import useUser from "../../../../../hooks/useUser";
import WarningDialog from "../../../../../components/mui/warning-dialog";
import EmailSuggestion from "../../../../../components/mui/email-suggestion";
import CustomLabel from "../../../../../components/mui/custom-label";
import SearchSelect from "../../../../../components/mui/search-select";
interface props {
    templates: ITemplate[];
    candidate: ICandidate | undefined;
    keywords: { [key: string]: string | number }
}

const SendDetail: FC<props> = ({ candidate, templates, keywords }) => {
    const { sendEmail } = CandidateService();
    const navigate = useNavigate();
    const { user } = useUser();
    const { typeOfLead } = useParams();
    const [searchParam] = useSearchParams();
    const { snackbar } = useSnackbar();
    const users = useSelector<{ user: { list: IUser[] } }, IUser[]>(state => state.user.list);
    const { control, getValues, setValue, resetField, trigger, watch, handleSubmit, reset, formState: { errors } } = useForm<ICandidateSendDetail>({
        resolver: joiResolver(candidateSendDetailValidation),
        defaultValues: {
            cc: [],
            bcc: [],
            to: "",
            template: "",
            ccText: "",
            bccText: "",
            subject: "",
            content: ""
        }
    });

    const [attachments, setAttachments] = useState({
        resumes: false,
        coderByte: false,
        contentAssessment: false,
        graphicAssessment: false,
    });

    const [coderByteWarning, setCoderByteWarning] = useState(false);
    const [confirmedWarning, setConfirmedWarning] = useState(false);

    const showWarningDialog = () => {
        setCoderByteWarning(true);
    };

    const handleFormSubmit = async () => {
        try {
            await handleSubmit(onSubmit)();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (confirmedWarning) {
            handleFormSubmit();
        }
    }, [confirmedWarning]);

    const handleWarningDialogConfirm = () => {
        setCoderByteWarning(false);
        setConfirmedWarning(true);
    };

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "template") {
                const template = templates.find(template => template._id === value.template);
                setValue("subject", String(template?.email.subject));
                setValue("content", String(template?.email.content));
                trigger("content");
            } else if (name && ["bccText", "ccText"].includes(name)) {
                trigger(name);
            }

        });
        return () => subscription.unsubscribe();
    }, [watch]);

    useEffect(() => {
        if (candidate) {
            setAttachments(prev => ({
                ...prev,
                resumes: candidate && candidate.resumes ? true : false,
                coderByte: candidate && candidate.coderByte ? true : false,
                contentAssessment: candidate && candidate.contentAssessment ? true : false,
                graphicAssessment: candidate && candidate.graphicAssessment ? true : false,
            }));
        }
        if (user) {
            const cc: string[] = getValues("cc") || [];
            cc.push(user?.email);
            setValue("cc", [...new Set(cc)]);
            trigger("cc");
        }
    }, [candidate, user]);

    const addEmail = (e: KeyboardEvent<HTMLDivElement>, key: string) => {
        let payload: string[] = [];

        if (key === "ccText" || key === "bccText") {
            const err = validateEmail(getValues(key));
            if (err.error) {
                return;
            }

            const enteredEmail = getValues(key) ? String(getValues(key)) : "";

            if (enteredEmail.trim() !== "" && e.key === "Enter") {
                if (key === "ccText") {
                    const prev = getValues("cc") ? getValues("cc") : [];
                    payload = [...prev, enteredEmail];
                    setValue("cc", [...new Set(payload)]);
                    resetField(key);
                } else if (key === "bccText") {
                    const prev = getValues("bcc") ? getValues("bcc") : [];
                    payload = [...prev, enteredEmail];
                    setValue("bcc", [...new Set(payload)]);
                    resetField(key);
                }
            }
        }
    };

    const handleEmailSelect = (email: string, name: string) => {
        let payload: string[] = [];
        if (["ccText", "bccText"].includes(name)) {
            if (name === "ccText") {
                const prev = getValues("cc") ? getValues("cc") : [];
                payload = [...prev, email];
                setValue("cc", [...new Set(payload)]);
                resetField(name);

            } else if (name === "bccText") {
                const prev = getValues("bcc") ? getValues("bcc") : [];
                payload = [...prev, email];
                setValue("bcc", [...new Set(payload)]);
                resetField(name);
            }
        }
    };

    const removeEmail = (key: string, value: string) => {
        if (key === "ccText") {
            let payload = getValues("cc");
            payload = payload.filter(email => email !== value);
            setValue("cc", payload);
            trigger("cc");
        } else if (key === "bccText") {
            let payload = getValues("bcc");
            payload = payload.filter(email => email !== value);
            setValue("bcc", payload);
            trigger("bcc");
        }
    };

    const handleAttachments = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        const name = event.target.name;
        const keyExist = name === "resumes" || name === "coderByte" || name === "contentAssessment" || name === "graphicAssessment";
        if (keyExist) {

            setAttachments(prev => (
                {
                    ...prev,
                    [name]: checked
                }
            ));
        }
    };

    const onSubmit = async (data: ICandidateSendDetail) => {
        if (!attachments.resumes) {
            snackbar("Resume is required", "warning");
            return;
        }

        if (!candidate?.testScore) {
            snackbar("Test Score is required", "warning");
            return;
        }

        if (!candidate?.currentLocation?.formattedAddress) {
            snackbar("Location is required", "warning");
            return;
        }

        const validateCoderByte = !candidate?.coderByte;

        if (validateCoderByte && !confirmedWarning) {
            showWarningDialog();
            return;
        }

        const interviewerName = users.find(user => user.email === data?.to);
        const moreKeywords = {
            ...keywords,
            interviewer: capitalize(interviewerName ? capitalize(interviewerName.name) : ""),
        };
        const payload = {
            ...data, ...attachments,
            subject: replaceHtmlKeyword(data.subject, moreKeywords),
            content: replaceHtmlKeyword(data.content, moreKeywords)
        };
        delete payload.ccText;
        delete payload.bccText;
        delete payload.template;

        try {
            const emailSent = await sendEmail({
                type: "interviewer_email",
                _lead: candidate?._id,
                ...payload,
                to: [payload.to]
            });
            navigate({
                pathname: `/candidates/${typeOfLead}`,
                search: searchParam.toString()
            });
            snackbar(emailSent.message, "info");
        } catch (error) {
            const err = error as IErrorResponse;
            snackbar(`${err.data.message.split(":")[1]} is not a valid Email`, "warning");
            console.log(error);
        }
    };

    const fields: ICandidateSendDetailField[] = [
        {
            type: "select",
            name: "to",
            label: "Interviewer Email",
            required: true,
            options: users,
            displayFieldKey: "name",
            storeFieldKey: "email",
            displayUserName: true,
        },
        {
            type: "select",
            name: "template",
            label: "Template",
            options: templates,
            displayFieldKey: "title",
            storeFieldKey: "_id",
        },
        {
            type: "input",
            name: "ccText",
            label: "CC",
            placeholder: "Type email address and press enter"
        },
        {
            type: "input",
            name: "bccText",
            label: "BCC",
            placeholder: "Type email address and press enter"
        },
        {
            type: "switch",
            name: "attachments",
            label: "attachments",
            attachments: [
                { name: "resumes", value: "Resume" },
                { name: "coderByte", value: "coder Byte" },
                { name: "contentAssessment", value: "Content Assessment" },
                { name: "graphicAssessment", value: "Graphic Assessment" },
            ]
        },
        {
            type: "input",
            name: "subject",
            label: "Subject",
            placeholder: "Type your subject here",
            width: 12,
            required: true
        },
        {
            type: "text-editor",
            name: "content",
            label: "Content",
            required: true
        },
    ];

    const onCopy = (url: string, label: string) => {
        navigator.clipboard.writeText(url);
        snackbar(`${capitalize(label)} ID copied to clipboard`, "info");
    };

    return (
        <Box paddingTop="10px">
            <Box sx={{ height: "37vh", overflow: "auto", padding: "10px 4px 0px" }}>
                <form onSubmit={handleSubmit(onSubmit)} onKeyDown={e => e.key === "Enter" && e.preventDefault()}>
                    <Grid container spacing={4}>
                        {
                            fields.map(field => {
                                if (field.type === "input" && field.name === "ccText" || field.name === "bccText") {
                                    return (<Grid key={field.label} item xs={12} md={field.width ? field.width : 6}>
                                        <EmailSuggestion
                                            control={control}
                                            label={<CustomLabel label={field.label} required={field?.required} />}
                                            name={field.name}
                                            value={getValues(field.name)}
                                            placeholder={field.placeholder}
                                            error={errors[field.name] ? true : false}
                                            helperText={errors[field.name]?.message}
                                            onEmailSelect={handleEmailSelect}
                                            onKeyUp={addEmail}
                                        />
                                        {
                                            <Box>
                                                {
                                                    field.name === "ccText" && getValues("cc") &&
                                                    getValues("cc").map(email => <Chip
                                                        key={email}
                                                        label={email}
                                                        onDelete={() => removeEmail(field.name, email)}
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ margin: "5px" }}
                                                        onClick={() => onCopy(email, "email")}
                                                    />)
                                                    ||
                                                    field.name === "bccText" && getValues("bcc") &&
                                                    getValues("bcc").map(email => <Chip
                                                        key={email}
                                                        label={email}
                                                        onDelete={() => removeEmail(field.name, email)}
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ margin: "5px" }}
                                                        onClick={() => onCopy(email, "email")}
                                                    />)
                                                }
                                            </Box>
                                        }
                                    </Grid>
                                    );
                                } else if (field.type === "input") {
                                    return (<Grid key={field.label} item xs={12} md={field.width ? field.width : 6}>
                                        <Controller
                                            control={control}
                                            name={field.name}
                                            render={(prop) => <TextField
                                                label={<CustomLabel label={field.label} required={field?.required} />}
                                                className="disable-text"
                                                variant={"outlined"}
                                                size={"small"}
                                                placeholder={field.placeholder}
                                                error={errors[field.name] ? true : false}
                                                helperText={errors[field.name]?.message}
                                                {...prop.field}

                                            />}
                                        />
                                    </Grid>
                                    );
                                } else if (field.type === "switch") {
                                    return (<Grid key={field.label} item xs={12} style={{ paddingLeft: 43 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend">Attachments</FormLabel>
                                            <Grid container spacing={4}>
                                                {
                                                    field.attachments?.map(ele => (<Grid key={ele.name} item>
                                                        <FormControlLabel
                                                            control={
                                                                <Switch disabled={candidate && candidate[ele.name] ? false : true} checked={attachments[ele.name] ? true : false} name={ele.name} onChange={handleAttachments} />
                                                            }
                                                            label={ele.value}
                                                        />
                                                    </Grid>
                                                    ))
                                                }
                                            </Grid>
                                        </FormControl>
                                    </Grid>);
                                } else if (field.type === "select") {
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
                                } else {
                                    return (<Grid key={field.label} item xs={12}>
                                        <Box className={errors[field.name] ? "tiny-error" : ""}>
                                            <TinyEditor value={getValues("content")} onChange={(e: string) => setValue("content", e)} height="375px" />
                                            {errors[field.name] && <FormHelperText sx={{ margin: "4px 14px 0px 14px" }} error={errors[field.name] ? true : false}>{errors[field.name]?.message}</FormHelperText>}
                                        </Box>
                                    </Grid>
                                    );
                                }
                            })
                        }
                    </Grid>
                    <Box className="action-box">
                        <Divider sx={{ marginBottom: "16px" }} />
                        <Button variant="outlined" onClick={() => reset()}>clear</Button>
                        <Button type="submit">Send</Button>
                    </Box>

                    {coderByteWarning && (
                        <WarningDialog
                            isOpen={coderByteWarning}
                            onClose={() => setCoderByteWarning(false)}
                            onConfirm={handleWarningDialogConfirm}
                            title="CoderByte"
                            description="Do you want to continue without CoderByte attachments ?"
                        />
                    )}
                </form>
            </Box>
        </Box >
    );
};

export default SendDetail;