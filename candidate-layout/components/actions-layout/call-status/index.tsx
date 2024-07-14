import { Box, Button, Grid, MenuItem, TextField } from "@mui/material";
import { ICallStatusRow, ICandidate, ICandidateCallStatus, IColumn, IErrorResponse } from "../../../../../interfaces";
import { Controller, useForm } from "react-hook-form";
import { callStatusValidation } from "../../../../../validations";
import { joiResolver } from "@hookform/resolvers/joi";
import CustomTable from "../../../../../components/mui/table";
import Select from "../../../../../components/mui/select";
import { FC, useEffect, useState } from "react";
import { capitalize, formatCallStatus, formatDateTime } from "../../../../../utilities/helper";
import { CandidateService } from "../../../../../services";
import useSnackbar from "../../../../../hooks/useSnackbar";
import { useOutletContext } from "react-router-dom";
import CustomLabel from "../../../../../components/mui/custom-label";

interface props {
    candidate: ICandidate | undefined;
    candidateDetailRefetch: () => void;
}

interface IState {
    list: ICallStatusRow[]
}

interface outletProps {
    reFetch: () => void
}

const CallStatus: FC<props> = ({ candidate, candidateDetailRefetch }) => {
    const callStatuses = candidate && candidate.callStatuses && [...candidate.callStatuses].reverse();
    const { addCandidateCallStatus } = CandidateService();
    const { snackbar } = useSnackbar();
    const outlet = useOutletContext<outletProps>();
    const [state, setState] = useState<IState>({
        list: []
    });
    const { control, handleSubmit, reset, formState: { errors } } = useForm<ICandidateCallStatus>({
        resolver: joiResolver(callStatusValidation),
        defaultValues: {
            status: "APPLIED",
            comment: ""
        }

    });

    useEffect(() => {
        if (callStatuses) {
            const list = callStatuses ? callStatuses.map((callStatus, i) => createRow(i, callStatus)) : [];
            setState(prevState => (
                {
                    ...prevState,
                    list
                }
            ));
        }
    }, [candidate?.callStatuses]);

    const onSubmit = async (data: ICandidateCallStatus) => {
        try {
            const payload = {
                _id: candidate ? candidate?._id : "",
                callData: {
                    ...data,
                    timestamp: new Date().toISOString(),
                }
            };

            const updatedCandidate = await addCandidateCallStatus(payload);
            snackbar(updatedCandidate.message, "info");
            reset();
            candidateDetailRefetch();
            outlet.reFetch();
        } catch (error) {
            const err = error as IErrorResponse;
            snackbar(err.data.message, "warning");
            console.log("error in candidate call status add", error);
        }
    };

    const columns: IColumn[] = [
        {
            id: "id",
            label: "S No."
        },
        {
            id: "status",
            label: "Status"
        },
        {
            id: "called_on",
            label: "Called On"
        },
        {
            id: "called_by",
            label: "Called By"
        },
        {
            id: "notes",
            label: "Notes",
            maxWidth: 370,
            whiteSpace: "normal"
        },
    ];

    const createRow = (index: number, callStatus: ICandidateCallStatus,) => (
        {
            id: index + 1,
            status: formatCallStatus(callStatus.status),
            called_on: formatDateTime(callStatus.createdAt),
            called_by: capitalize(callStatus.addedBy.name),
            notes: capitalize(callStatus.comment)
        }
    );

    return (
        <Box paddingTop="10px">
            <Box height="51vh" overflow="auto" paddingTop="10px">
                <Box marginBottom="20px">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2}>
                            <Grid item md={3}>
                                <Select
                                    control={control}
                                    name="status"
                                    label={<CustomLabel label="status" required />}
                                    size={"small"}
                                    variant={"outlined"}
                                    error={errors.status ? true : false}
                                    helperText={errors["status"]?.message}
                                >
                                    <MenuItem value="APPLIED">Applied</MenuItem>
                                    <MenuItem value="CALL_NA">Called NA</MenuItem>
                                    <MenuItem value="TBC_LATER">TBC Later</MenuItem>
                                    <MenuItem value="NOT_INTERESTED">Not Interested</MenuItem>
                                </Select>
                            </Grid>
                            <Grid item md={6}>
                                <Controller
                                    control={control}
                                    name="comment"
                                    render={(prop) => <TextField
                                        label={<CustomLabel label="Note" required={false} />}
                                        variant="outlined"
                                        size="small"
                                        placeholder="Add call status summary"
                                        error={errors.comment ? true : false}
                                        helperText={errors["comment"]?.message}
                                        {...prop.field}
                                    />}
                                />
                            </Grid>
                            <Grid item md={3}>
                                <Button
                                    fullWidth
                                    type="submit"
                                >
                                    Add Call Status
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Box>

                <CustomTable
                    columns={columns}
                    rows={state.list}
                    height="calc(100% - 72px)"
                    width="calc(100% - 2px)"
                />
            </Box>
        </Box>
    );
};

export default CallStatus;
