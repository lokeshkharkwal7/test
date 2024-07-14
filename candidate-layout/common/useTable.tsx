import { ChangeEvent } from "react";
import { Checkbox, Box,IconButton , FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { capitalize, createIndex, formatMobileNumber } from "../../../utilities/helper";
import { ICandidate, IPagination, IStatus, IUser } from "../../../interfaces";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import GetActions from "../../../components/get-actions";
import useResource from "../../../hooks/useResource";
import CustomTypography from "../../../components/mui/max-length-limit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import useSnackbar from "../../../hooks/useSnackbar";

interface props {
    typeOfLead?: string;
}

const useTable = ({ typeOfLead }: props) => {
    const navigate = useNavigate();
    const [searchParam] = useSearchParams();
    const { allowPermission, resourceAllocate } = useResource();
    const {snackbar} = useSnackbar();
    const users = useSelector<{ user: { list: IUser[] } }, IUser[]>(state => state.user.list);
    const statusList = useSelector<{ status: { list: IStatus[] } }, IStatus[]>(state => state.status.list);
    const statusNames = statusList.map(user => user.name?.toUpperCase());
    const userIds = users.map(user => user._id);

    const actionNavigate = (_id: string, type: string) => {
        searchParam.set("type", type);
        navigate({ pathname: "action/" + _id, search: searchParam.toString() });
    };

    const createColumn = (handleSelectAll: (event: ChangeEvent<HTMLInputElement>) => void, isChecked: boolean, isIndeterminateChecked: boolean) => {
        if (typeOfLead === "intern") {
            return [
                {
                    id: "all",
                    label: <Checkbox onChange={handleSelectAll} checked={isChecked} indeterminate={isIndeterminateChecked} />
                },
                {
                    id: "id",
                    label: "S No."
                },
                {
                    id: "candidate_name",
                    label: "Name"
                },
                {
                    id: "candidate_email",
                    label: "Email"
                },
                {
                    id: "candidate_phone",
                    label: "Phone"
                },
                {
                    id: "candidate_JobId",
                    label: "Job Title"
                },
                {
                    id: "candidate_graduation_year",
                    label: "Graduation Year"
                },
                {
                    id: "candidate_assign_to",
                    label: "Assign To"
                },
                {
                    id: "status",
                    label: "Status"
                },
                {
                    id: "action",
                    label: "Actions"
                },
            ];
        } else {
            return [
                {
                    id: "all",
                    label: <Checkbox onChange={handleSelectAll} checked={isChecked} indeterminate={isIndeterminateChecked} />
                },
                {
                    id: "id",
                    label: "S No."
                },
                {
                    id: "candidate_name",
                    label: "Name"
                },
                {
                    id: "candidate_email",
                    label: "Email"
                },
                {
                    id: "candidate_phone",
                    label: "Phone"
                },
                {
                    id: "candidate_JobId",
                    label: "Job Title"
                },
                {
                    id: "candidate_experience",
                    label: "Experience"
                },
                {
                    id: "candidate_ctc",
                    label: "CTC"
                },
                {
                    id: "candidate_ectc",
                    label: "ECTC"
                },
                {
                    id: "candidate_notice_period",
                    label: "Notice Period"
                },
                {
                    id: "candidate_assign_to",
                    label: "Assign To"
                },
                {
                    id: "status",
                    label: "Status"
                },
                {
                    id: "action",
                    label: "Actions"
                },
            ];
        }
    };

    const onCopy = (url:string,label:string) => {
      navigator.clipboard.writeText(url);
      snackbar(`${capitalize(label)} ID copied to clipboard`, "info");
    };

    const createRow = (
        index: number,
        pagination: IPagination,
        candidate: ICandidate,
        selectedAll: string[],
        handleAssignTo: (e: SelectChangeEvent<string>, id: string) => void,
        handleStatus: (e: SelectChangeEvent<string>, id: string) => void,
        handleSelect: (e: ChangeEvent<HTMLInputElement>, id: string) => void,
        onDelete: (id: string) => void
    ) => {

        const assignTo =
            <FormControl
                sx={{ width: 150 }}>
                <Select
                    size="small"
                    disabled={allowPermission(candidate.createdBy?._user) || resourceAllocate("lead.write") ? false : true}
                    onChange={e => handleAssignTo(e, candidate._id)}
                    name="_user"
                    value={
                        userIds.includes(candidate.createdBy?._user)
                            ?
                            candidate.createdBy?._user
                            :
                            "none"
                    }
                >
                    <MenuItem disabled value="none">Select</MenuItem>
                    {
                        users.map((user, i) => <MenuItem key={i} value={user._id}>{`${capitalize(user.firstName)} ${capitalize(user.lastName)}`}</MenuItem>)
                    }
                </Select>
            </FormControl>;

        const status =
            <FormControl
                sx={{ width: 150 }}
            >
                <Select
                    size="small"
                    name="status"
                    disabled={allowPermission(candidate.createdBy?._user) || resourceAllocate("lead.write")  ? false : true}
                    onChange={e => handleStatus(e, candidate?._id)}
                    value={
                        statusNames.includes(candidate.status.toUpperCase()) ||
                            candidate.status === "APPLIED" ||
                            candidate.status === "CALL_NA" ||
                            candidate.status === "NOT_INTERESTED" ||
                            candidate.status === "TBC_LATER" ||
                            candidate.status === "ROHIT SELECTED" ||
                            candidate.status === "ROHIT REJECTED" ||
                            candidate.status === "ROHIT SCHEDULED"
                            ?
                            candidate.status.toUpperCase()
                            :
                            "none"
                    }
                >
                    <MenuItem disabled value="none">Select</MenuItem>
                    <MenuItem value="CALL_NA">Called NA</MenuItem>
                    <MenuItem value="NOT_INTERESTED">Not Interested</MenuItem>
                    <MenuItem value="TBC_LATER">TBC Later</MenuItem>
                    {
                        statusList
                            .filter(status => status.type === "CANDIDATE" && status.status === "ACTIVE")
                            .map((user, i) => <MenuItem key={i} value={user?.name.toUpperCase()}>{capitalize(user?.name)}</MenuItem>)
                    }
                    <MenuItem value="ROHIT SCHEDULED">Rohit Scheduled</MenuItem> 
                    <MenuItem value="ROHIT SELECTED">Rohit Selected</MenuItem>
                    <MenuItem value="ROHIT REJECTED">Rohit Rejected</MenuItem>
                </Select>
            </FormControl>;

        const action = <GetActions
            icons={
                allowPermission(candidate.createdBy?._user) || resourceAllocate("lead.write") 
                    ?
                    [
                        { name: "Mail", method: () => actionNavigate(candidate._id, "mail") },
                        { name: "SMS", method: () => actionNavigate(candidate._id, "sms") },
                        { name: "Call Status", method: () => actionNavigate(candidate._id, "call-status") },
                        { name: "Interview", method: () => actionNavigate(candidate._id, "interview") },
                        { name: "Send Detail", method: () => actionNavigate(candidate._id, "send-detail") },
                        { name: "Add Review", method: () => actionNavigate(candidate._id, "review") },
                        { name: "Delete", method: () => onDelete(candidate._id) },
                    ]
                    :
                    [
                        { name: "Mail", method: () => actionNavigate(candidate._id, "mail"), disabled: true },
                        { name: "SMS", method: () => actionNavigate(candidate._id, "sms"), disabled: true },
                        { name: "Call Status", method: () => actionNavigate(candidate._id, "call-status"), disabled: true },
                        { name: "Interview", method: () => actionNavigate(candidate._id, "interview"), disabled: true },
                        { name: "Send Detail", method: () => actionNavigate(candidate._id, "send-detail"), disabled: true },
                        { name: "Add Review", method: () => actionNavigate(candidate._id, "review"), disabled: true },
                        { name: "Delete", method: () => onDelete(candidate._id), disabled: true },
                    ]
            }
        />;

        if (typeOfLead === "intern") {
            return {
                all: <Checkbox onChange={e => handleSelect(e, candidate._id)} checked={selectedAll.includes(candidate._id)} disabled={allowPermission(candidate.createdBy?._user) ? false : true} />,
                id: createIndex(pagination, index),
                candidate_name: (
                    <CustomTypography
                        limit={30}
                        label={capitalize(candidate.name)}
                        onClick={() => navigate({ pathname: "manage/" + candidate._id, search: searchParam.toString() })}
                        color={["CALL_NA", "APPLIED"].includes(candidate.status) ? "error" : "primary"}
                    />
                ),
                candidate_email: (
                    <Box display="flex" alignItems="center">
                    <IconButton className="ml-2" onClick={() => onCopy(candidate.email,"email")} size="small">
                    <ContentCopyIcon fontSize="small" />
                    </IconButton >
                    <CustomTypography
          limit={20}
          label={candidate.email}
        />
        </Box>
                ),
                candidate_phone: formatMobileNumber(candidate.mobileNumber) || "",
                candidate_graduation_year: candidate.graduationYear,
                candidate_JobId: candidate.jobId?.title,
                candidate_assign_to: assignTo,
                status: status,
                action,
            };
        } else {
            return {
                all: <Checkbox onChange={e => handleSelect(e, candidate._id)} checked={selectedAll.includes(candidate._id)} disabled={allowPermission(candidate.createdBy?._user) ? false : true} />,
                id: createIndex(pagination, index),
                candidate_name: (
                    <CustomTypography
                        limit={30}
                        label={capitalize(candidate.name)}
                        onClick={() => navigate({ pathname: "manage/" + candidate._id, search: searchParam.toString() })}
                        color={["CALL_NA", "APPLIED"].includes(candidate.status) ? "error" : "primary"}
                    />
                ),
                candidate_email: (
                    <Box display="flex" alignItems="center">
                    <IconButton className="ml-2" onClick={() => onCopy(candidate.email,"email")} size="small">
                    <ContentCopyIcon fontSize="small" />
                    </IconButton >
                    <CustomTypography
          limit={20}
          label={candidate.email}
        />
        </Box>
                ),
                candidate_phone: formatMobileNumber(candidate.mobileNumber) || "",
                candidate_experience: candidate.experience,
                candidate_ctc: candidate.ctc,
                candidate_ectc: candidate.ectc,
                candidate_notice_period: candidate.noticePeriod,
                candidate_JobId: candidate.jobId?.title,
                candidate_assign_to: assignTo,
                status: status,
                action,
            };
        }
    };

    return { createColumn, createRow };
};

export default useTable;