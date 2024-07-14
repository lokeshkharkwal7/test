import { JobService, UsersService, cpdDriveService } from "../../../services";
import { isValidDate } from "../../../utilities/helper";
import { validateEmail, validateName } from "../../../validations/shared";

const useValidateImport = () => {
    const { getJob } = JobService();
    const { getCpdDrive } = cpdDriveService();
    const { getUser } = UsersService();

    // eslint-disable-next-line
    const validateInternsUpload = async (leads: any[], typeOfLead: string) =>
        // eslint-disable-next-line
        new Promise(async (resolve) => {
            const mandatoryFields = ["name", "mobileNumber", "jobId", "status"];
            const payload = [];
            const error = [];
            let row = 2;

            for await (const lead of leads) {
                if (!lead?.length) {
                    ++row;
                    continue;
                }

                // eslint-disable-next-line
                const data: any = {};
                // eslint-disable-next-line
                const errMessage: any = {};
                if (typeof lead[1] === "string") {
                    const err = validateName(lead[1]);
                    if (!err.error) {
                        data.name = lead[1];
                        data.typeOfLead = typeOfLead?.toUpperCase();
                    } else {
                        errMessage["Name"] = "Name must be a string";
                    }
                } else {
                    if (lead[1] === undefined) {
                        errMessage["Name"] = "Name is required";
                    }
                }

                if (typeof lead[2] === "string" && isValidDate(lead[2])) {
                    data.date = isValidDate(lead[2].trim());
                } else {
                    if (lead[2] !== undefined) {
                        errMessage["Date"] = "Please enter a valid date";
                    }
                }

                if (typeof lead[3] === "string") {
                    try {
                        const job = await getJob({
                            jobId: lead[3].trim()
                        });
                        if (job) {
                            if (job?.data?.type === "intern" && job?.data?.status === "OPEN") {
                                data.jobId = job.data?._id;
                                data.createdBy = {
                                    _user: job.data?.assignTo,
                                    name: "ADMIN",
                                };
                            } else if (job?.data?.type !== "intern") {
                                errMessage["Job Title"] = "Only Intern jobs are allowed";
                            } else if (job?.data?.status !== "OPEN") {
                                errMessage["Job Title"] = "Please select Active Job Title";
                            }
                        } else {
                            errMessage["Job Title"] = "Invalid Job Title Id";
                        }
                    } catch (error) {
                        errMessage["Job Title"] = "Invalid Job Title Id";
                    }
                } else {
                    if (lead[3] === undefined) {
                        errMessage["Job Title"] = "Job Title is required";
                    } else {
                        errMessage["Job Title"] = "Please enter a valid job Title Id";
                    }
                }

                if (typeof lead[4] === "string") {
                    data.firstSkill = lead[4].trim();
                } else {
                    if (lead[4] !== undefined) {
                        errMessage["First Skill"] = "First skill must be a string";
                    }
                }

                if (typeof lead[5] === "string") {
                    data.secondSkill = lead[5].trim();
                } else {
                    if (lead[5] !== undefined) {
                        errMessage["Second Skill"] = "Second skill must be a string";
                    }
                }

                if (lead[6] === undefined) {
                    errMessage["Contact Number"] = "Contact Number is required";
                } else if (typeof lead[6] === "number") {
                    const mobileNumber = lead[6].toString();
                    if (mobileNumber.length === 10) {
                        data.mobileNumber = { number: mobileNumber, dialCode: "+91", iso2: "IN", country: "INDIA" };
                    } else {
                        errMessage["Contact Number"] = "Contact Number should be a 10-digit number";
                    }
                } else {
                    errMessage["Contact Number"] = "Please enter only numbers for Contact Number";
                }

                if (typeof lead[7] === "string") {
                    try {
                        const user = await getUser({
                            userId: lead[7].trim(),
                        });
                        if (user.data?._id) {
                            data.createdBy = {
                                _user: user.data?._id,
                                name: "'ADMIN'",
                            };
                        } else {
                            errMessage["Recruiter"] = "Please enter a valid recruiter Id";
                        }
                    } catch (error) {
                        errMessage["Recruiter"] = "Please enter a valid recruiter Id";
                    }
                } else {
                    if (lead[7] !== undefined) {
                        errMessage["Recruiter"] = "Please enter a valid recruiter Id";
                    }
                }

                if (typeof lead[8] == "string") {
                    const err = validateEmail(lead[8]);
                    if (!err.error) {
                        data.email = lead[8];
                    } else {
                        errMessage["Email Address"] = "Please enter a valid email address";
                    }

                } else {
                    if (lead[8] !== undefined) {
                        errMessage["Email Address"] = "Please enter a valid email address";
                    }
                }

                if (typeof lead[9] == "string") {
                    data.status = lead[9].toUpperCase().trim();
                } else {
                    if (lead[9] === undefined) {
                        errMessage["Status"] = "Status is required";
                    }
                    else {
                        errMessage["Status"] = "Status must be string";
                    }
                }

                if (typeof lead[10] == "string") {
                    data.location = lead[10].toUpperCase().trim();
                } else {
                    if (lead[10] !== undefined) {
                        errMessage["Work Location"] = "Work Location must be WHO or WFH";
                    }
                }

                if (typeof lead[11] == "string") {
                    data.currentLocation = { formattedAddress: lead[11].toUpperCase().trim() };
                } else {
                    if (lead[11] !== undefined) {
                        errMessage["Home Location"] = "Home Location ";
                    }
                }

                if (typeof lead[12] === "number") {
                    data.testScore = Math.round(lead[12]);
                } else {
                    if (lead[12] !== undefined) {
                        errMessage["Technical Score"] = "Technical score must be a number";
                    }
                }

                if (typeof lead[13] === "string") {
                    try {
                        const cpd = await getCpdDrive({
                            cpdId: lead[13],
                        });
                        if (cpd.data) {
                            data._cpd = lead[13];
                        } else {
                            errMessage["CPD ID"] = "Please enter a valid CPD ID";
                        }
                    } catch (error) {
                        errMessage["CPD ID"] = "Please enter a valid CPD ID";
                    }
                } else {
                    if (lead[13] !== undefined) {
                        errMessage["CPD ID"] = "Please enter a valid CPD ID";
                    }
                }

                if (typeof lead[14] === "string") {
                    data.comments = lead[14].trim();
                } else {
                    if (lead[14] !== undefined) {
                        errMessage["Comments"] = "Comment must be a string";
                    }
                }

                if (mandatoryFields.every((value) => Object.keys(data).includes(value))) {
                    if (Object.keys(errMessage).length) {
                        error.push({ ...errMessage, row });
                    } else {
                        payload.push(data);
                    }
                } else {
                    if (Object.keys(errMessage).length) {
                        error.push({ ...errMessage, row });
                    }
                }
                ++row;
            }

            // return all the data
            resolve({
                data: payload,
                errorMessage: error,
            });

        });

    // eslint-disable-next-line
    const validateFulltimeUpload = async (leads: any[], typeOfLead: string) =>
        // eslint-disable-next-line
        new Promise(async (resolve) => {
            const mandatoryFields = ["name", "mobileNumber", "jobId"];
            const payload = [];
            const error = [];
            let row = 2;

            for await (const lead of leads) {
                if (!lead?.length) {
                    ++row;
                    continue;
                }

                // eslint-disable-next-line
                const data: any = {};
                // eslint-disable-next-line
                const errMessage: any = {};

                if (typeof lead[1] === "string") {
                    const err = validateName(lead[1]);
                    if (!err.error) {
                        data.name = lead[1].trim();
                        data.typeOfLead = typeOfLead?.toUpperCase();
                    } else {
                        errMessage["Name"] = "Name must be a string";
                    }
                } else {
                    if (lead[1] === undefined) {
                        errMessage["Name"] = "Name is required";
                    }
                }

                if (typeof lead[2] === "string" && isValidDate(lead[2])) {
                    data.date = isValidDate(lead[2].trim());
                } else {
                    if (lead[2] !== undefined) {
                        errMessage["Date"] = "Please enter a valid date";
                    }
                }

                if (typeof lead[3] === "string") {
                    try {
                        const job = await getJob({
                            jobId: lead[3].trim()
                        });
                        if (job) {
                            if (typeOfLead === "full-time" && job?.data?.type === "full-time" && job?.data?.status === "OPEN") {
                                data.jobId = job.data?._id;
                                data.createdBy = {
                                    _user: job.data?.assignTo,
                                    name: "ADMIN",
                                };
                            } else if (typeOfLead === "consultant" && job?.data?.type === "consultant" && job?.data?.status === "OPEN") {
                                data.jobId = job.data?._id;
                                data.createdBy = {
                                    _user: job.data?.assignTo,
                                    name: "ADMIN",
                                };
                            } else {
                                errMessage["Job Title"] = `Only ${typeOfLead} jobs are allowed`;
                                if (job?.data?.status !== "OPEN") {
                                    errMessage["Job Title"] = "Please select Active Job Title";
                                }
                            }
                        } else {
                            errMessage["Job Title"] = "Invalid Job Title Id";
                        }
                    } catch (error) {
                        errMessage["Job Title"] = "Invalid Job Title Id";
                    }
                } else {
                    if (lead[3] === undefined) {
                        errMessage["Job Title"] = "Job Title is required";
                    } else {
                        errMessage["Job Title"] = "Please enter a valid job Title Id";
                    }
                }

                if (typeof lead[4] === "string") {
                    data.firstSkill = lead[4].trim();
                } else {
                    if (lead[4] !== undefined) {
                        errMessage["First Skill"] = "First skill must be a string";
                    }
                }

                if (typeof lead[5] === "string") {
                    data.secondSkill = lead[5].trim();
                } else {
                    if (lead[5] !== undefined) {
                        errMessage["Second Skill"] = "Second skill must be a string";
                    }
                }

                if (lead[6] === undefined) {
                    errMessage["Contact Number"] = "Contact Number is required";
                } else if (typeof lead[6] === "number") {
                    const mobileNumber = lead[6].toString();
                    if (mobileNumber.length === 10) {
                        data.mobileNumber = { number: mobileNumber, dialCode: "+91", iso2: "IN", country: "INDIA" };
                    } else {
                        errMessage["Contact Number"] = "Contact Number should be a 10-digit number";
                    }
                } else {
                    errMessage["Contact Number"] = "Please enter only numbers for Contact Number";
                }

                if (typeof lead[7] === "string") {
                    try {
                        const user = await getUser({
                            userId: lead[7].trim(),
                        });
                        if (user.data?._id) {
                            data.createdBy = {
                                _user: user.data?._id,
                                name: "'ADMIN'",
                            };
                        } else {
                            errMessage["Recruiter"] = "Please enter a valid recruiter Id";
                        }
                    } catch (error) {
                        errMessage["Recruiter"] = "Please enter a valid recruiter Id";
                    }
                } else {
                    if (lead[7] !== undefined) {
                        errMessage["Recruiter"] = "Please enter a valid recruiter Id";
                    }
                }

                if (typeof lead[8] == "string") {
                    const err = validateEmail(lead[8]);
                    if (!err.error) {
                        data.email = lead[8];
                    } else {
                        errMessage["Email Address"] = "Please enter a valid email address";
                    }
                } else {
                    if (lead[8] !== undefined) {
                        errMessage["Email Address"] = "Please enter a valid email address";
                    }
                }

                if (typeof lead[9] == "string") {
                    data.status = lead[9].toUpperCase();
                } else {
                    if (lead[9] === undefined) {
                        errMessage["Status"] = "Status is required";
                    }
                    else {
                        errMessage["Status"] = "Status must be string";
                    }
                }

                if (typeof lead[10] == "string") {
                    data.location = lead[10].toUpperCase().trim();
                } else {
                    if (lead[10] !== undefined) {
                        errMessage["Work Location"] = "Work Location must be WHO or WFH";
                    }
                }

                if (typeof lead[11] == "string") {
                    data.currentLocation = { formattedAddress: lead[11].toUpperCase().trim() };
                } else {
                    if (lead[11] !== undefined) {
                        errMessage["Home Location"] = "Home Location ";
                    }
                }

                if (typeof lead[12] === "number") {
                    data.testScore = Math.round(lead[12]);
                } else {
                    if (lead[12] !== undefined) {
                        errMessage["Technical Score"] = "Technical score must be a number";
                    }
                }

                if (typeof lead[13] == "number") {
                    if (lead[13] <= 20) {
                        data.experience = lead[13];
                    }
                    else {
                        errMessage["Exp. (Y)"] = "Experience should not be greater than 20 years";
                    }
                } else {
                    if (lead[13] !== undefined) {
                        errMessage["Exp. (Y)"] = "Experience must be in year";
                    }
                }

                if (typeof lead[14] == "number") {
                    data.expMonth = lead[14];
                } else {
                    if (lead[14] !== undefined) {
                        errMessage["Exp. (M)"] = "Experience must be in month";
                    }
                }

                if (typeof lead[15] == "number") {
                    if (lead[15] <= 50) {
                        data.ctc = lead[15];
                    } else {
                        errMessage["CTC (LPA)"] =
                            "Expected CTC should not be greater than 50 LPA ";
                    }
                } else {
                    if (lead[15] !== undefined) {
                        errMessage["CTC (LPA)"] = "CTC must be in LPA";
                    }
                }

                if (typeof lead[16] == "number") {
                    if (lead[16] <= 50) {
                        data.ectc = lead[16];
                    } else {
                        errMessage["ECTC (LPA)"] =
                            "Expected CTC should not be greater than 50 LPA ";
                    }

                } else {
                    if (lead[16] !== undefined) {
                        errMessage["ECTC (LPA)"] = "Expected CTC must be in LPA";
                    }
                }

                if (typeof lead[17] == "number") {
                    if (lead[17] <= 100) {
                        data.noticePeriod = lead[17];
                    } else {
                        errMessage["Notice Period"] =
                            "Notice period should not be greater than 100 days";
                    }
                } else {
                    if (lead[17] !== undefined) {
                        errMessage["Notice Period"] = "Notice period must be in days";
                    }
                }

                if (typeof lead[18] === "string" && isValidDate(lead[18])) {
                    data.lwd = isValidDate(lead[18].trim());
                } else {
                    if (lead[18] !== undefined) {
                        errMessage["LWD"] = "LWD must be a date";
                    }
                }
                if (typeof lead[19] == "string") {
                    data.url = lead[19].trim();
                } else {
                    if (lead[19] !== undefined) {
                        errMessage["Profile Url"] = "Profile Url must be a valid url";
                    }
                }
                if (typeof lead[20] === "string") {
                    data.comments = lead[20].trim();
                } else {
                    if (lead[20] !== undefined) {
                        errMessage["Comments"] = "Comment must be a string";
                    }
                }

                if (mandatoryFields.every((value) => Object.keys(data).includes(value))) {
                    if (Object.keys(errMessage).length) {
                        error.push({ ...errMessage, row });
                    } else {
                        payload.push(data);
                    }
                } else {
                    if (Object.keys(errMessage).length) {
                        error.push({ ...errMessage, row });
                    }
                }
                ++row;
            }
            // return all the data
            resolve({
                data: payload,
                errorMessage: error,
            });
        });

    return { validateInternsUpload, validateFulltimeUpload };
};

export default useValidateImport;

