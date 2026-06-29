using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class FireUltimate : MonoBehaviour, InterfaceSpell
{
    public bool ActiveUltimate;
    public float Delay;

    public GameObject HorizontalWave;
    public GameObject VerticalWave;
    public GameObject DiagWave;
    public GameObject OtherDiagWave;

    public GameObject Minion;
   
    private void Update()
    {
        //check boss Health here -> ActivateUlti = true;

        if (ActiveUltimate)
        {
            print("boop");
            StartCoroutine(Ultimate());
            ActiveUltimate = false;
        }
    }
    
    

    private IEnumerator Ultimate()
    {
        print("Ultimate");
        Transform pos = transform;

        Instantiate(HorizontalWave);
        yield return new WaitForSeconds(Delay);
        Instantiate(VerticalWave);
        yield return new WaitForSeconds(Delay);
        Instantiate(DiagWave);
        yield return new WaitForSeconds(Delay);
        Instantiate(OtherDiagWave);
        
        yield return new WaitForSeconds(3);
        foreach(GameObject i in GameObject.FindGameObjectsWithTag("FireWave"))
        {
            Destroy(i);
        }
        
    }

    public void ActivateUltimateF()
    {
        ActiveUltimate = true;
    }
    
    public void InvokeMinion()
    {

        var minion2Pos = transform.position;

        minion2Pos.y -= 3;

        // print("Minion Spawn");
        Instantiate(Minion, minion2Pos, Quaternion.identity);
    }
}
