import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../../../helper/user'
import getNumber from "@/helper/numberformat";
import { decrypt } from "@/helper/decryptFile";
import yearPublished from "@/helper/filefunctions";

type StylingProps = {
    highlighted: boolean;
    bold: boolean,
    colored: boolean,
    underlined: boolean,
    special: boolean
}

type RowObject = {
    columns: Array<any>;
    styling: StylingProps;
}

interface InitialProps {
    InitialState: User;
    data: Array<any>;
}

const FILEREF = 'anhang';

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const cols: Array<String> = alphabet.slice(0, 5).split("");
    const lowerLimit = 14;
    const higherLimit = 16;

    let rows: Array<RowObject> = [];

    for(let r=lowerLimit; r<= higherLimit; r++){
        let rowobj: RowObject = {
            columns: [],
            styling: {
                colored: false,
                bold: false,
                underlined: false,
                highlighted: false,
                special: false,
            }
        }

        cols.forEach((col) => {
            let val = workbook.Sheets['Mitarbeiter'][col.concat(r.toString())];
            if(val){
                rowobj.columns.push(val.v);
            }else{
                rowobj.columns.push(null);
            }
        });

        rows.push(rowobj);
    }

    const underlinedrows = [rows.length-1];
    const boldrows = [rows.length-1]

    boldrows.forEach((row) => {
        rows[row].styling.bold = true;
    })

    underlinedrows.forEach((row) => {
        rows[row].styling.underlined = true;
    })
    
    return rows;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;

    let qyear = -1;
    if(ctx.query.year){
        try{
            qyear = parseInt(ctx.query.year as string);
        }catch(e){
            res.writeHead(302, { Location: "/notfound" });
            res.end();
    
            return { props: { InitialState: {} } };
        }

        if (!cookies.login) {
            let pub = await yearPublished(qyear);
            if(!pub){
                res.writeHead(302, { Location: "/notpublished" });
                res.end();
    
                return { props: { InitialState: {} } };
            }
        }
    
        const year = qyear;
        const path = `./public/data/${year}/${FILEREF}.xlsx`;
        let guvdata: Array<any> = [1, 2, 3];
        if(fs.existsSync(path)){
    
            guvdata = await parseFile(path);
        
    
            return {
                props: {
                    InitialState: {},
                    data: guvdata,
                },
            };
        }else{
            res.writeHead(302, { Location: "/notfound" });
            res.end();
    
            return { props: { InitialState: {} } };
        }
    }else{
        res.writeHead(302, { Location: "/" });
        res.end();

        return { props: { InitialState: {} } };
    }
};

export default function Verbindlichkeiten(props: InitialProps){
    const currentYear = new Date().getFullYear() - 1;

    const formatNumber = (value: number, index: Number, limit: Number) => {
        if(index != limit){
            let percentval = value*100;
            return percentval.toLocaleString("de-DE") + " %";
        }else{
            return getNumber(value, false, 1) + " T€"
        }
    }

    const getTableContent = () => {
        

        return props.data.map((rowobj, idx) => {
            let row = rowobj.columns;
            let allempty = row.every((v: any) => v === null );
            
            if(!allempty){
                /* return (
                    <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                        <td className="cell-title">{row[0]}</td>
                        <td className="cell-spacer" ><div className="spacer-content"></div></td>
                        <td className="cell-val">{formatNumber(row[1], idx, props.data.length-1)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{formatNumber(row[2], idx, props.data.length-1)}</td>
                    </tr>
                ); */
                return(
                    <div key={idx} className={`tablecontentrow ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.special)? "special-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.none)? "none-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""}`}>
                        <div className="tablecellwide">
                            <div className="possiblecontent-title">{row[0]}</div>
                        </div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{formatNumber(row[1], idx, props.data.length-1)}</div>
                        <div className="tablecellspacer"></div>
                        <div className="tablecellnumber">{formatNumber(row[2], idx, props.data.length-1)}</div>
                    </div>
                );
            }
        });


    }

    /* return(
        <div className="presentation-page">
            <table>
                <thead>
                    <tr>
                        <th className="cell-title">Mitgliedschaft</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">KBV<br />VBL</th>
                        <th className="cell-spacer"></th>
                        <th className="cell-headline">KSG<br />kvw</th>
                    </tr>
                </thead>
                <tbody>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    ); */
    return(
        <div className="presentation-page">
            <div className="tablestructure">
                <div className="tableheadlinerow">
                    <div className="tablecellwide">Mitgliedschaft</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">KBV<br />VBL</div>
                    <div className="tablecell tablecellspacer"></div>
                    <div className="tablecell">KSG<br />kvw</div>
                </div>

                {getTableContent()}
            </div>
        </div>
    );
}