import { Box, Button, Chip, Divider, FormHelperText, Grid, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { ICandidateMailField, ICandidateMail, ITemplate, IErrorResponse, ICandidate } from "../../../../../interfaces";
import { FC, KeyboardEvent, useEffect } from "react";
import TinyEditor from "../../../../../components/text-editor";
import { joiResolver } from "@hookform/resolvers/joi";
import { candidateMailValidation } from "../../../../../validations";
import { CandidateService } from "../../../../../services";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useSnackbar from "../../../../../hooks/useSnackbar";
import { validateEmail } from "../../../../../validations/shared";
import { replaceHtmlKeyword } from "../../../../../utilities/helper";
import useUser from "../../../../../hooks/useUser";
import { capitalize } from "../../../../../utilities/helper";
import EmailSuggestion from "../../../../../components/mui/email-suggestion";
import CustomLabel from "../../../../../components/mui/custom-label";
import SearchSelect from "../../../../../components/mui/search-select";
interface props {
    templates: ITemplate[],
    candidate: ICandidate | undefined;
    keywords: { [key: string]: string | number }

}

const Mail: FC<props> = ({ templates, keywords, candidate }) => {
    const { sendEmail } = CandidateService();
    const navigate = useNavigate();
    const { user } = useUser();
    const { typeOfLead } = useParams();
    const { snackbar } = useSnackbar();
    const [searchParam] = useSearchParams();
    const { control, getValues, setValue, resetField, trigger, watch, handleSubmit, reset, formState: { errors } } = useForm<ICandidateMail>({
        resolver: joiResolver(candidateMailValidation),
        defaultValues: {
            to: "",
            template: "",
            ccText: "",
            bccText: "",
            subject: "",
            content: ""
        }
    });

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "template") {
                const template = templates.find(template => template._id === value.template);
                setValue("subject", String(template?.email.subject));
                setValue("content", String(template?.email.content));
                trigger("content");
            } else if (name && ["to", "bccText", "ccText"].includes(name)) {
                trigger(name);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    useEffect(() => {
        if (candidate) {
            setValue("to", candidate.email);
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
        if (name === "to") {
            setValue("to", email);
        } else if (["ccText", "bccText"].includes(name)) {
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

    const onSubmit = async (data: ICandidateMail) => {
        const payload = {
            ...data,
            subject: replaceHtmlKeyword(data.subject, keywords),
            content: replaceHtmlKeyword(data.content, keywords)
        };
        delete payload.ccText;
        delete payload.bccText;
        delete payload.template;

        try {
            const emailSent = await sendEmail({
                type: "candidate_email",
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

    const fields: ICandidateMailField[] = [
        {
            type: "input",
            name: "to",
            label: "To",
            required: true
        },
        {
            type: "select",
            name: "template",
            label: "Template",
            options: templates,
            displayFieldKey: "title",
            storeFieldKey: "_id"
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
            type: "input",
            name: "subject",
            label: "Subject",
            placeholder: "Type subject here",
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
    const onCopy = (url:string,label:string) => {
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
                                if (field.type === "input" && field.name === "to" || field.name === "ccText" || field.name === "bccText") {
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
                                                        onClick = {() => onCopy(email,"email")}
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
                                                        onClick = {() => onCopy(email,"email")}
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
                                } else if (field.type === "text-editor") {
                                    return (<Grid key={field.label} item xs={12}>
                                        <Box className={errors[field.name] ? "tiny-error" : ""}>
                                            <TinyEditor value={getValues("content")} onChange={(e: string) => setValue("content", e)} height="375px" />
                                            {errors[field.name] && <FormHelperText sx={{ margin: "4px 14px 0px 14px" }} error={errors[field.name] ? true : false}>{errors[field.name]?.message}</FormHelperText>}
                                        </Box>
                                    </Grid>
                                    );
                                }
                                else {
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
                    </Grid>
                    <Box className="action-box">
                        <Divider sx={{ marginBottom: "16px" }} />
                        <Button variant="outlined" onClick={() => reset()}>clear</Button>
                        <Button type="submit">Send</Button>
                    </Box>
                </form>
            </Box>
        </Box >
    );
};

export default Mail;