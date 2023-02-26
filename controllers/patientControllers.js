import db from '../db/connect.js'
import jwt from 'jsonwebtoken'

const personalData = async (req, res) => {
    const { mobile, DoB, weight, height, country_of_origin, diabetic, cardiac, BP, disease_desc } = req.body;
    if (!mobile || !DoB || !weight || !height || !country_of_origin || !disease_desc) {
        return res.json({ status: "error", error: "please provide all values" })
    }
    else {
        var age = new Date().getFullYear() - new Date(DoB).getFullYear()
        var h = height.split("-")
        var h_m = h[0] * 0.3048 + h[1] * 0.0254
        var BMI = (weight / h_m ** 2).toFixed(2)

        const token = req.headers.authorization.split(' ')[1]
        const decode = jwt.verify(token, process.env.JWT_SECRET)

        db.query('SELECT * FROM patientPersonalData  WHERE userID = ?', [decode.id], async (err, result) => {
            if (err) throw err;
            if (result[0]) return res.json({ error: "Personal data already filled!!" })
            else {

                db.query('INSERT INTO patientPersonalData  SET ?', {
                    userId: decode.id,
                    mobile: mobile,
                    DoB: DoB,
                    age: age,
                    weight: weight,
                    height: height,
                    BMI: BMI,
                    country_of_Origin: country_of_origin,
                    diabetic: diabetic,
                    cardiac: cardiac,
                    BP: BP,
                    disease_desc: disease_desc,
                }, (error, result) => {
                    if (error) throw error;
                    return res.json({ status: "success", success: "Personal data filled!!", PersonalData: result })
                })
            }
        })
    }
}

const familyData = async (req, res) => {
    const { father_name, father_age, father_country, mother_name, mother_age, mother_country, parents_diabetic, parents_cardiac, parents_BP } = req.body;
    const token = req.headers.authorization.split(' ')[1]
    const decode = jwt.verify(token, process.env.JWT_SECRET)

    if (!father_name || !father_age || !father_country || !mother_name || !mother_age || !mother_country) {
        return res.json({ status: "error", error: "please provide all values" })
    }
    else {
        db.query('SELECT patientId from patientPersonalData where userId = ?', [decode.id], async (err,PatientId ) => {
            if (err) throw err;
            else{
                db.query('SELECT * FROM patientFamilyData  WHERE patientID = ?', [PatientId[0].patientId], async (err, result) => {
                    if (err) throw err;
                    if (result[0]) return res.json({ error: "Family data is already filled!!" })
                    else {

                        db.query('INSERT INTO patientFamilyData  SET ?', {
                            patientId: PatientId[0].patientId,
                            father_name: father_name,
                            father_age: father_age,
                            father_country: father_country,
                            mother_name: mother_name,
                            mother_age: mother_age,
                            mother_country: mother_country,
                            parents_diabetic: parents_diabetic,
                            parents_cardiac: parents_cardiac,
                            parents_BP: parents_BP,
                        }, (error, result) => {
                            if (error) throw error;
                            return res.json({ status: "success", success: "Family data filled!!" })
                        })
                    }
                })
            }
        })
    }

}

const documents = async (req, res) => {
    res.send("documents")
}

const updatePersonalData = async (req, res) => {

    const { height, weight, DoB } = req.body
    const token = req.headers.authorization.split(' ')[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    var BMI, age;

    db.query('SELECT height ,weight,DoB, age, BMI from patientPersonalData WHERE userId=?', [decode.id], async (err, result) => {
        if (DoB) {
            age = new Date().getFullYear() - new Date(DoB).getFullYear()
        }
        else{
            age = result[0].age;
        }

        if (height && weight) {
            var h = height.split("-")
            BMI = (weight / (h[0] * 0.3048 + h[1] * 0.0254) ** 2).toFixed(2);
        }
        else if (!weight && height) {
            var h = height.split("-")
            BMI = (result[0].weight / (h[0] * 0.3048 + h[1] * 0.0254) ** 2).toFixed(2);
            //console.log(BMI)
        }
        else if (!height && weight) {
            BMI = (weight / (result[0].height[0] * 0.3048 + result[0].height[2] * 0.0254) ** 2).toFixed(2);
            // console.log(BMI)
        }
        else{
            BMI = result[0].BMI;
        }
        db.query("UPDATE patientPersonalData SET ?,age=?, BMI =? WHERE userId=?", [req.body, age, BMI, decode.id], async (err, user) => {
            if (err) throw err
            else {
                //console.log(user)
                return res.send("Data updated successfully")
            }
        })
    })
}

const updateFamilyData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    db.query('SELECT patientId from patientPersonalData WHERE userId=?', [decode.id], async (err, PatientId) => {
        if (err) throw err;
        else {
            //console.log(patientId[0].patientID)
            db.query("UPDATE patientFamilyData SET ? WHERE patientId=?", [req.body, PatientId[0].patientId], async (err, user) => {
                if (err) throw err
                else {
                    return res.send("Data updated successfully")
                }
            })
        }
    })
}

const deleteProfile = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    db.query("SELECT patientId from patientPersonalData WHERE userId=?", [decode.id], async (err, PatientId) => {
        if (err) throw err
        else {
            if (!PatientId[0]) {
                db.query("DELETE FROM userData WHERE userId=?", [decode.id], async (err, result) => {
                    if (err) throw err;
                    else{
                        return res.send("Record deleted Successfully")
                    }
                })
            }
            else {
                db.query("DELETE FROM patientFamilyData WHERE patientId =?", [PatientId[0].patientId], async (err, result) => {
                    if (err) throw err;
                    else {
                        db.query("DELETE FROM patientPersonalData WHERE patientId=?", [PatientId[0].patientId], async (err, result) => {
                            if (err) throw err;
                            else {
                                db.query("DELETE FROM userData WHERE userId=?", [decode.id], async (err, result) => {
                                    if (err) throw err;
                                    else {
                                        return res.send("Record deleted successfully")
                                    }
                                })
                            }
                        })
                    }
                })
            }

        }
    })
}


export { personalData, familyData, documents, updatePersonalData, updateFamilyData, deleteProfile }