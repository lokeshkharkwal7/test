import { Box, Button, Chip, Divider, FormControl, FormControlLabel, FormHelperText, FormLabel, Grid, Switch, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { ICandidateReviewField, ICandidateReview, ITemplate, ICandidate, IErrorResponse, IUser } from "../../../../../interfaces";
import { FC, KeyboardEvent, useEffect, useState } from "react";
import TinyEditor from "../../../../../components/text-editor";
import { joiResolver } from "@hookform/resolvers/joi";
import { candidateReviewValidation } from "../../../../../validations";
import { ReviewService } from "../../../../../services";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useSnackbar from "../../../../../hooks/useSnackbar";
import { validateEmail } from "../../../../../validations/shared";
import { useSelector } from "react-redux";
import { capitalize, replaceHtmlKeyword } from "../../../../../utilities/helper";
import { useOutletContext } from "react-router-dom";
import useUser from "../../../../../hooks/useUser";
import EmailSuggestion from "../../../../../components/mui/email-suggestion";
import CustomLabel from "../../../../../components/mui/custom-label";
import SearchSelect from "../../../../../components/mui/search-select";

interface props {
    templates: ITemplate[];
    candidate: ICandidate | undefined;
    keywords: { [key: string]: string | number }

}

interface outletProps {
    reFetch: () => void
}

const Review: FC<props> = ({ candidate, templates, keywords }) => {
    const { addReview } = ReviewService();
    const navigate = useNavigate();
    const { user } = useUser();
    const { typeOfLead } = useParams();
    const { snackbar } = useSnackbar();
    const outlet = useOutletContext<outletProps>();
    const [searchParam] = useSearchParams();
    const users = useSelector<{ user: { list: IUser[] } }, IUser[]>(state => state.user.list);
    const { control, getValues, setValue, resetField, trigger, watch, handleSubmit, reset, formState: { errors } } = useForm<ICandidateReview>({
        resolver: joiResolver(candidateReviewValidation),
        defaultValues: {
            _reviewer: "",
            template: "",
            ccText: "",
            bccText: "",
            subject: "",
            content: "",
            cc: [],
            bcc: [],
        }
    });


    const [attachments, setAttachments] = useState({
        resumes: false,
        coderByte: false,
        contentAssessment: false,
        graphicAssessment: false,
    });


    const fields: ICandidateReviewField[] = [
        {
            type: "select",
            name: "_reviewer",
            label: "Reviewer",
            required: true,
            options: users,
            displayFieldKey:"name",
            storeFieldKey: "_id",
            displayUserName: true,
        },
        {
            type: "select",
            name: "template",
            label: "Template",
            options: templates,
            displayFieldKey:"title",
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
            required:true
        },
        {
            type: "text-editor",
            name: "content",
            label: "Content",
            required: true
        },
    ];

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
                coderByte: false,
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

    const onSubmit = async (data: ICandidateReview) => {
        const moreKeywords = {
            ...keywords,
            reviewer: capitalize(data?._reviewer),
        };
        const payload = {
            ...data, ...attachments,
            subject: replaceHtmlKeyword(data.email?.subject, moreKeywords),
            content: replaceHtmlKeyword(data.email?.content, moreKeywords)
        };
        delete payload.ccText;
        delete payload.bccText;
        delete payload.template;
        try {
            const reviewSchedule = await addReview({
                _lead: candidate?._id,
                ...payload,
                _reviewer: payload._reviewer,
                email: {
                    subject: data.subject,
                    content: data.content,
                },
            });
            navigate({
                pathname: `/candidates/${typeOfLead}`,
                search: searchParam.toString()
            });
            snackbar(reviewSchedule.message, "info");
            outlet.reFetch();
        } catch (error) {
            const err = error as IErrorResponse;
            snackbar(`${err.data.message.split(":")[1]} is not a valid Email`, "warning");
            console.log(error);
        }
    };

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
                                } else if (field.type === "switch") {
                                    return (<Grid key={field.label} item xs={12}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend">Attachments</FormLabel>
                                            <Grid container spacing={4}>
                                                {
                                                    field.attachments?.map(ele => (<Grid key={ele.name} item>
                                                        <FormControlLabel
                                                            control={
                                                                <Switch disabled={candidate && candidate[ele.name] ? false : true} checked={attachments[ele.name] ? true : false} name={ele.name} onChange={handleAttachments} />
                                                            }
                                                            label={<CustomLabel label={ele.value} required={field?.required} />}
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
                                            <TinyEditor 
                                            value={getValues("content")} 
                                            onChange={(e: string) => setValue("content", e)}
                                            height="375px" 
                                            />
                                            {errors[field.name] && 
                                            <FormHelperText 
                                            sx={{ margin: "4px 14px 0px 14px" }} 
                                            error={errors[field.name] ? true : false}
                                            >
                                                {errors[field.name]?.message}
                                            </FormHelperText>}
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
                        <Button type="submit">Schedule</Button>
                    </Box>
                </form>
            </Box>
        </Box >
    );
};

export default Review;