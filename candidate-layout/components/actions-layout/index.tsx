import "./style.scss";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SyntheticEvent, useEffect, useState } from "react";
import { BootstrapDialog, BootstrapDialogTitle, TabPanel, a11yProps } from "../../../../components/shared/mui-tabs";
import DialogContent from "@mui/material/DialogContent";
import { useQuery } from "@tanstack/react-query";
import { CandidateService } from "../../../../services";
import { capitalize, formatMobileNumber, formateEngagementType, displayName } from "../../../../utilities/helper";
import Mail from "./mail";
import Sms from "./sms";
import CallStatus from "./call-status";
import Interview from "./interview";
import SendDetail from "./send-detail";
import { useSelector } from "react-redux";
import { ITemplate } from "../../../../interfaces";
import Review from "./review";
import useUser from "../../../../hooks/useUser";

const redirectionLinks = ["mail", "sms", "call-status", "interview", "send-detail", "review"];

const CandidateActionLayout = () => {
    const navigate = useNavigate();
    const [...templates] = useSelector<{ template: { list: ITemplate[] } }, ITemplate[]>(state => state.template.list) || [];
    const { typeOfLead, leadId } = useParams();
    const { user } = useUser();
    const [value, setValue] = useState(0);
    const { getCandidatePartial } = CandidateService();
    const [searchParam, setSearchParam] = useSearchParams();
    const candidate = useQuery({
        queryKey: ["candidate"],
        queryFn: () => getCandidatePartial({ _id: leadId })
    });

    useEffect(() => {
        const tab = searchParam.get("type") ? String(searchParam.get("type")) : "mail";
        setValue(redirectionLinks.indexOf(tab));
    }, [searchParam]);

    const handleChange = (event: SyntheticEvent, newValue: number) => {
        searchParam.set("type", redirectionLinks[newValue]);
        setSearchParam(searchParam);
    };

    const onClose = () => {
        searchParam.delete("type");
        navigate({
            pathname: `/candidates/${typeOfLead}`,
            search: searchParam.toString()
        });
    };

    const keywords = {
        name: capitalize(candidate.data?.data.name || ""),
        email: candidate.data?.data?.email || "",
        collegeName: capitalize(candidate.data?.data?.collegeName || ""),
        jobTitle: capitalize(candidate.data?.data?.jobId?.title || ""),
        department: capitalize(candidate.data?.data?.jobId?.department || ""),
        location: candidate.data?.data?.location || "",
        mobileNumber: formatMobileNumber(candidate.data?.data?.mobileNumber),
        engagementType: formateEngagementType(candidate.data?.data?.typeOfLead || ""),
        score: candidate.data?.data?.testScore || "",
        portfolioUrl: candidate.data?.data?.portfolio || "",
        campusStatus: candidate.data?.data?._cpd?.length ? "On Campus" : "Off Campus",
        userName: `${capitalize(displayName(user))}`,
        userNumber: formatMobileNumber(user?.phone),
        userDepartment: capitalize(user?.department?.name),
        userDesignation: user?.designation || "",
    };

    const name = candidate.data?.data.name ? capitalize(candidate.data?.data.name) : "Candidate Actions";
    const source = candidate.data?.data.source ? candidate.data?.data.source : undefined;

    return <div>
        <BootstrapDialog
            maxWidth="md"
            onClose={onClose}
            open={typeOfLead ? true : false}
        >
            <BootstrapDialogTitle onClose={onClose}>
                <Box display="flex" alignItems="center">
                    {name}
                </Box>
                <Box className="center" justifyContent="space-between">
                    {
                        source &&
                        <Box display="flex">
                            <Typography variant="subtitle1">Source:</Typography>
                            <Typography className="ml-2" variant="overline">{source}</Typography>
                        </Box>
                    }
                </Box>
            </BootstrapDialogTitle>
            <DialogContent dividers sx={{ height: "60vh" }}>
                <Box width="100%" >
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                            <Tab className="tabs-space start-tab-space" label="Mail" {...a11yProps(0)} />
                            <Tab className="tabs-space" label="SMS" {...a11yProps(1)} />
                            <Tab className="tabs-space" label="Call Status" {...a11yProps(1)} />
                            <Tab className="tabs-space" label="Interview" {...a11yProps(1)} />
                            <Tab className="tabs-space" label="Send Detail" {...a11yProps(1)} />
                            <Tab className="tabs-space" label="Review" {...a11yProps(1)} />
                        </Tabs>
                    </Box>

                    {/* Mail  */}
                    <TabPanel value={value} index={0}>
                        <Mail
                            candidate={candidate.data?.data}
                            templates={templates.filter(template => template.type === "email" && template.tag === "general")}
                            keywords={keywords}
                        />
                    </TabPanel>

                    {/* SMS  */}
                    <TabPanel value={value} index={1}>
                        <Sms
                            candidate={candidate.data?.data}
                            templates={templates.filter(template => template.type === "sms" && template.tag === "general")}
                            keywords={keywords}
                        />
                    </TabPanel>

                    {/* Call status  */}
                    <TabPanel value={value} index={2}>
                        <CallStatus
                            candidate={candidate.data?.data}
                            candidateDetailRefetch={candidate.refetch}
                        />
                    </TabPanel>

                    {/* Interview  */}
                    <TabPanel value={value} index={3}>
                        <Interview
                            candidate={candidate.data?.data}
                            templates={templates.filter(template => template.type === "email" && template.tag === "google_calendar")}
                            keywords={keywords}
                        />
                    </TabPanel>

                    {/* Send Detail  */}
                    <TabPanel value={value} index={4}>
                        <SendDetail
                            templates={templates.filter(template => template.type === "email" && template.tag === "interviewer")}
                            candidate={candidate.data?.data}
                            keywords={keywords}
                        />
                    </TabPanel>

                    {/* Review  */}
                    <TabPanel value={value} index={5}>
                        <Review
                            templates={templates.filter(template => template.type === "email" && template.tag === "review")}
                            candidate={candidate.data?.data}
                            keywords={keywords}
                        />
                    </TabPanel>
                </Box>
            </DialogContent>
        </BootstrapDialog>
    </div>;
};

export default CandidateActionLayout;
