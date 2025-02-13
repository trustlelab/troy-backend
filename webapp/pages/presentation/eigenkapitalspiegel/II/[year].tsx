import "./style.scss"
import { GetServerSideProps } from "next";
import fs from 'fs';
import { read } from 'xlsx';
import { User } from '../../../../helper/user'
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
    scale: boolean;
}

const FILEREF = 'eigenkapitalspiegel';

async function parseFile(path: string){
    const buffer = fs.readFileSync(path);
    const decryptedbuffer = await decrypt(buffer);
    const workbook = read(decryptedbuffer);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const cols: Array<String> = alphabet.slice(8, 14).split("");
    cols.unshift("A")
    const lowerLimit = 19;
    const higherLimit = 28;

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
            let val = workbook.Sheets['EK Spiegel nach DRS 22'][col.concat(r.toString())];
            if(val){
                rowobj.columns.push(val.v);
            }else{
                rowobj.columns.push(null);
            }
        });

        rows.push(rowobj);
    }

    const boldrows = [19, 28];
    const underlinedrows = [19,26, 27];

    boldrows.forEach((row) => {
        rows[row-lowerLimit].styling.bold = true;
    })

    underlinedrows.forEach((row) => {
        rows[row-lowerLimit].styling.underlined = true;
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
                    scale: (ctx.query.scaled)? ctx.query.scaled=="1": false
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

export default function Eigenkapitelspiegel(props: InitialProps){

    const getTableContent = () => {

        return props.data.map((rowobj, idx) => {

            let row = rowobj.columns;

            let allempty = row.every((v: any) => v === null );

            if(!allempty){
                return (
                    <tr key={idx} className={`bordered-row ${(allempty)? "row-spacer": ""} ${(rowobj.styling.bold)? "bold-row": ""} ${(rowobj.styling.underlined)? "underlined-row": ""} ${(rowobj.styling.colored)? "colored-row": ""} ${(rowobj.styling.highlighted)? "highlighted-row": ""} ${(rowobj.styling.special)? "special-row": ""}`.replace(/\s+/g,' ').trim()}>
                        <td className="row-meaning">{row[0]}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[1], true)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[2], true)}</td>
                        <td className="cell-spacer"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[3], true)}</td>
                        <td className="cell-spacer-wide"><div className="spacer-content"></div></td>
                        <td className="cell-spacer-wide"><div className="spacer-content"></div></td>
                        <td className="cell-val">{getNumber(row[5], true)}</td>

                    </tr>
                );
            }
        });


    }

    return(
        <div className="presentation-page" style={{transform: `scale(${(props.scale)? 0.6: 1})`, transformOrigin: `0 0`, height: (!props.scale)? 800: 380}}>
            <table>
                <thead>
                    <tr>
                        <th className="empty-headline-cell"></th>
                        <th className="empty-headline-cell cell-spacer"></th>
                        <th colSpan={5} className="cell-headline">Nicht beherrschbare Anteile</th>
                        <th className="empty-headline-cell cell-spacer-wide"></th>
                        <th className="empty-headline-cell cell-spacer-wide"></th>
                        <th className="cell-headline">Konzerneigenkapital</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="special-headline-row">
                        <td className="empty-headline-cell"></td>
                        <td className="cell-spacer empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>am Kapital</td>
                        <td className="cell-spacer empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>Am Jahres-Überschuss</td>
                        <td className="cell-spacer empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>Summe</td>
                        <td className="cell-spacer-wide empty-headline-cell"><div className="spacer-content"></div></td>
                        <td className="cell-spacer-wide empty-headline-cell"><div className="spacer-content"></div></td>
                        <td></td>
                    </tr>
                    <tr className="currency-row">
                    <td className="empty-headline-cell"></td>
                        <td className="cell-spacer empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>€</td>
                        <td className="cell-spacer-wide empty-headline-cell"><div className="spacer-content"></div></td>
                        <td className="cell-spacer-wide empty-headline-cell"><div className="spacer-content"></div></td>
                        <td>€</td>
                    </tr>
                    <tr className="row-spacer"></tr>
                    {getTableContent()}
                </tbody>
            </table>
        </div>
    );
}