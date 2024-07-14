import { Box, Button, Chip, DialogContent, Divider, FormHelperText, Grid, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { ICandidate, ICandidateInterview, ICandidateInterviewField, ICandidateInterviewExtra, IErrorResponse, ITemplate, IUser } from "../../../../../interfaces";
import { candidateInterviewValidation } from "../../../../../validations";
import { FC, KeyboardEvent, useEffect, useState } from "react";
import { joiResolver } from "@hookform/resolvers/joi";
import { useSelector } from "react-redux";
import { capitalize, replaceHtmlKeyword } from "../../../../../utilities/helper";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import useSnackbar from "../../../../../hooks/useSnackbar";
import { InterviewService } from "../../../../../services";
import { validateEmail } from "../../../../../validations/shared";
import { formatDateTime } from "../../../../../utilities/helper";
import useUser from "../../../../../hooks/useUser";
import EmailSuggestion from "../../../../../components/mui/email-suggestion";
import { BootstrapDialog, BootstrapDialogTitle } from "../../../../../components/shared/mui-tabs";
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


const Interview: FC<props> = ({ templates, candidate, keywords }) => {
    const { addInterview } = InterviewService();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { user } = useUser();
    const { typeOfLead } = useParams();
    const [searchParam] = useSearchParams();
    const { snackbar } = useSnackbar();
    const [interviewScheduleForcefully, setInterviewScheduleForcefully] = useState<ICandidateInterviewExtra>({} as ICandidateInterviewExtra);
    const outlet = useOutletContext<outletProps>();
    const users = useSelector<{ user: { list: IUser[] } }, IUser[]>(state => state.user.list);
    const { control, getValues, setValue, resetField, trigger, watch, handleSubmit, reset, formState: { errors } } = useForm<ICandidateInterview>({
        resolver: joiResolver(candidateInterviewValidation),
        defaultValues: {
            interview_round: "",
            _interviewer: "",
            emailText: "",
            template: "",
            interviewDateTime: "",
        }
    });
    const handleClose = () => {
        setOpen(false);
    };

    const onClose = () => {
        navigate("/candidates/intern");
    };
    const handleOpen = () => {
        setOpen(true);
    };

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "template") {
                const template = templates.find(template => template._id === value.template);
                setValue("googleTemplate.subject", String(template?.email.subject));
                setValue("googleTemplate.content", String(template?.email.content));
            }
            trigger(name);

        });
        return () => subscription.unsubscribe();
    }, [watch, templates]);

    useEffect(() => {
        if (user) {
            const attendees: string[] = getValues("attendees") || [];
            attendees.push(user?.email);
            setValue("attendees", [...new Set(attendees)]);
            trigger("attendees");
        }
    }, [user]);

    const addEmail = (e: KeyboardEvent<HTMLDivElement>, key: string) => {
        let payload: string[] = [];

        if (key === "emailText") {
            const err = validateEmail(getValues(key));
            if (err.error) {
                return;
            }

            const enteredEmail = getValues(key) ? String(getValues(key)) : "";

            if (enteredEmail.trim() !== "" && e.key === "Enter") {
                if (key === "emailText") {
                    const prev = getValues("attendees") ? getValues("attendees") : [];
                    payload = [...prev, enteredEmail];
                    setValue("attendees", [...new Set(payload)]);
                    resetField(key);
                }
            }
        }
    };

    const handleEmailSelect = (email: string, name: string) => {
        let payload: string[] = [];
        if (name === "emailText") {
            const prev = getValues("attendees") ? getValues("attendees") : [];
            payload = [...prev, email];
            setValue("attendees", [...new Set(payload)]);
            resetField(name);

        }
    };

    const removeEmail = (value: string) => {
        let payload = getValues("attendees");
        payload = payload.filter(email => email !== value);
        setValue("attendees", payload);
        trigger("attendees");
    };

    // eslint-disable-next-line
    const selectDate = (value: Date | null) => {
        const date = value && dayjs(value) ? dayjs(value)?.toISOString() : undefined;
        setValue("interviewDateTime", date);
        trigger("interviewDateTime");
    };

    const onSubmit = async (data: ICandidateInterview) => {
        const selectedTime = dayjs(data.interviewDateTime);
        const currentTime = dayjs();
        if (selectedTime.isBefore(currentTime, "minute")) {
            snackbar("Interview time cannot be in the past. Please select a current or future time", "warning");
            return;
        }
        const moreKeywords = {
            ...keywords,
            interviewRound: data?.interview_round,
            interviewer: capitalize(data?._interviewer),
            interviewDate: formatDateTime(data?.interviewDateTime),
        };
        const payload = {
            ...data,
            googleTemplate: {
                subject: replaceHtmlKeyword(data.googleTemplate?.subject, moreKeywords),
                content: replaceHtmlKeyword(data.googleTemplate?.content, moreKeywords)
            }
        };
        delete payload.emailText;
        delete payload.template;

        try {
            const newPayload = {
                ...payload,
                _lead: candidate?._id,
            };
            setInterviewScheduleForcefully({
                ...payload,
                _lead: candidate?._id as string,
                interviewScheduleForcefully: true
            });
            const interviewScheduled = await addInterview(newPayload);
            navigate({
                pathname: `/candidates/${typeOfLead}`,
                search: searchParam.toString()
            });
            snackbar(interviewScheduled.message, "info");
            outlet.reFetch();
        } catch (error) {
            const err = error as IErrorResponse;
            if (err?.data?.message === "Slot already booked") {
                handleOpen();
            }
            console.log(error);
        }
    };

    const fields: ICandidateInterviewField[] = [
        {
            type: "select",
            name: "interview_round",
            label: "Interview Round",
            required: true,
            options: [
                { key: "HR SCHEDULED", value: "HR Scheduled" },
                { key: "TA SCHEDULED", value: "TA Scheduled" },
                { key: "ROHIT SCHEDULED", value: "Rohit Scheduled" },
            ],
            displayFieldKey: "value",
            storeFieldKey: "key"
        },
        {
            type: "select",
            name: "_interviewer",
            label: "Interviewer",
            required: true,
            options: users,
            displayFieldKey: "name",
            storeFieldKey: "_id",
            displayUserName: true,
        },
        {
            type: "input",
            name: "emailText",
            label: "Attendees",
            placeholder: "Type email address and press enter"
        },
        {
            type: "select",
            name: "template",
            label: "Template",
            required: true,
            options: templates,
            displayFieldKey: "title",
            storeFieldKey: "_id",
            capitalize: true,
        },
        {
            type: "date",
            name: "interviewDateTime",
            label: "Interview Schedule Date and Time",
            required: true
        }
    ];

    const onStatusUpdate = async () => {
        const interviewScheduled = await addInterview(interviewScheduleForcefully);
        navigate({
            pathname: `/candidates/${typeOfLead}`,
            search: searchParam.toString()
        });
        snackbar(interviewScheduled.message, "info");
        outlet.reFetch();
    };

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
                                if (field.type === "input" && field.name === "emailText") {
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
                                                    field.name === "emailText" && getValues("attendees") &&
                                                    getValues("attendees").map(email => <Chip
                                                        key={email}
                                                        label={email}
                                                        onDelete={() => removeEmail(email)}
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
                                } else if (field.type === "date") {
                                    return (<Grid key={field.label} item xs={12} md={6}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <MobileDateTimePicker
                                                label={<CustomLabel label={field.label} required={field?.required} />}
                                                onChange={(e: Date | null) => selectDate(e)}
                                                slotProps={{
                                                    textField: {
                                                        error: errors[field.name] ? true : false,
                                                        helperText: errors[field.name]?.message
                                                    }
                                                }}
                                                shouldDisableDate={(date) => dayjs(date).isBefore(dayjs(), "day")}
                                                format="LLL"
                                            />
                                        </LocalizationProvider>

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
                    {validateEmail(candidate?.email).error && <Box marginTop={2}><FormHelperText error={true}>{"Note: 'Candidate Email' must be a valid email"}</FormHelperText></Box>}
                    <Box className="action-box">
                        <Divider sx={{ marginBottom: "16px" }} />
                        <Button variant="outlined" onClick={() => reset()}>clear</Button>
                        <Button type="submit" disabled={validateEmail(candidate?.email).error ? true : false}>Schedule</Button>
                    </Box>

                </form>
                <BootstrapDialog
                    open={open}
                    onClose={handleClose}
                    style={{ height: "450px" }}
                >
                    <BootstrapDialogTitle
                        onClose={onClose} />
                    <Divider sx={{ marginTop: "10px" }} />
                    <DialogContent>
                        <Typography sx={{ height: "120px" }}>The slot is already booked. Are you sure you want to schedule the interview forcefully?</Typography>
                        <Box className="action-box">
                            <Divider sx={{ marginBottom: "10px" }} />
                            <Button onClick={() => onStatusUpdate()}>Schedule</Button>
                            <Button onClick={handleClose}>Cancel</Button>
                        </Box>
                    </DialogContent>
                </BootstrapDialog>

            </Box>
        </Box>
    );
};

export default Interview;