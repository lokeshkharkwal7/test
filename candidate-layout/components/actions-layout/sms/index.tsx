import { Box, Button, Divider, Grid, SelectChangeEvent, TextField } from "@mui/material";
import { ICandidateSmsField, ICandidateSms, ITemplate, IErrorResponse, ICandidate } from "../../../../../interfaces";
import { Controller, useForm } from "react-hook-form";
import { candidateSmsValidation } from "../../../../../validations";
import { joiResolver } from "@hookform/resolvers/joi";
import { FC, useEffect, useState } from "react";
import { CandidateService } from "../../../../../services";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useSnackbar from "../../../../../hooks/useSnackbar";
import MobileNumber from "../../../../../components/mui/mobile-number";
import { replaceHtmlKeyword } from "../../../../../utilities/helper";
import CustomLabel from "../../../../../components/mui/custom-label";
import SearchSelect from "../../../../../components/mui/search-select";
interface props {
    templates: ITemplate[];
    candidate: ICandidate | undefined;
    keywords: { [key: string]: string | number }
}

const Sms: FC<props> = ({ templates, candidate, keywords }) => {
    const { sendSms } = CandidateService();
    const navigate = useNavigate();
    const { typeOfLead } = useParams();
    const [searchParam] = useSearchParams();
    const { snackbar } = useSnackbar();
    const { control, setValue, getValues, watch, trigger, handleSubmit, reset, formState: { errors } } = useForm<ICandidateSms>({
        resolver: joiResolver(candidateSmsValidation),
        defaultValues: {
            to: "",
            template: "",
            content: ""
        }
    });
    const [mobileNumber, setMobileNumber] = useState({
        country: "INDIA",
        dialCode: "+91",
        iso2: "IN"
    });

    useEffect(() => {
        if (candidate && candidate.mobileNumber && "country" in candidate.mobileNumber) {
            setMobileNumber(candidate?.mobileNumber);
            setValue("to", candidate.mobileNumber.number);
        }
    }, [candidate?.mobileNumber]);

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "template") {
                const template = templates.find(template => template._id === value.template);
                setValue("content", String(template?.sms));
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const onNumberChange = (e: SelectChangeEvent<string>) => {
        const { value } = e.target;
        const data = value.split(":");
        setMobileNumber({
            country: data[0],
            iso2: data[1],
            dialCode: data[2]
        });
    };


    const onSubmit = async (data: ICandidateSms) => {
        const payload = {
            ...data,
            to: `${mobileNumber.dialCode} ${data.to}`,
            body: data.content ? replaceHtmlKeyword(data.content, keywords) : "",
            _lead: candidate?._id,
        };
        delete payload.template;
        delete payload.content;

        try {
            const smsSent = await sendSms(payload);
            navigate({
                pathname: `/candidates/${typeOfLead}`,
                search: searchParam.toString()
            });
            snackbar(smsSent.message, "info");
        } catch (error) {
            const err = error as IErrorResponse;
            snackbar(err.data.message, "warning");
            console.log(error);
        }

    };

    const fields: ICandidateSmsField[] = [
        {
            type: "mobile-number",
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
            storeFieldKey: "_id",
            capitalize: true
        },
        {
            type: "multiline",
            name: "content",
            label: "Body",
            placeholder: "Type sms here",
            width: 12,
            required: true
        },

    ];

    return (
        <Box paddingTop="10px">
            <Box height="43vh" overflow="auto" paddingTop="10px">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={4}>
                        {
                            fields.map(field => {
                                if (field.type === "input") {
                                    return (<Grid key={field.label} item xs={12} md={field.width ? field.width : 6}>
                                        <Controller
                                            control={control}
                                            name={field.name}
                                            render={(prop) => <TextField
                                                label={<CustomLabel label={field.label} required={field?.required} />}
                                                className="disable-text"
                                                variant={"outlined"}
                                                size={"small"}
                                                error={errors[field.name] ? true : false}
                                                helperText={errors[field.name]?.message}
                                                {...prop.field}
                                            />}
                                        />
                                    </Grid>
                                    );
                                }
                                else if (field.type === "multiline") {
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
                                                multiline
                                                minRows={4}
                                                {...prop.field}
                                            />}
                                        />
                                    </Grid>
                                    );
                                }

                                else if (field.type === "mobile-number") {
                                    return (<Grid key={field.label} item xs={12} md={field.width ? field.width : 6}>
                                        <Controller
                                            control={control}
                                            name={field.name}
                                            render={(prop) => <MobileNumber
                                                key={field.label}
                                                dialCodeValue={`${mobileNumber.country}:${mobileNumber.iso2}:${mobileNumber.dialCode}`}
                                                onChange={onNumberChange}
                                                error={errors[field.name] ? true : false}
                                                helperText={errors[field.name]?.message}
                                                other={prop.field}
                                            />}
                                        />
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
                        <Button variant="outlined" onClick={() => reset()}>Clear</Button>
                        <Button type="submit">Send SMS</Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
};

export default Sms;